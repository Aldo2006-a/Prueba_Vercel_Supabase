import cartRepository from '../repositories/carts_repository.js';
import productRepository from '../repositories/products_repository.js';
import optionGroupRepository from '../repositories/option_groups_repository.js';
import storeRepository from '../repositories/stores_repository.js';
import { serviceError } from './errors.js';

const MAX_QUANTITY = 20;

const redondear = (n) => Math.round(n * 100) / 100;

/**
 * Convierte el carrito de la base en el formato que usa el front.
 * El subtotal y el total se calculan aquí con los precios actuales del producto.
 */
const toView = (cart) => {
  if (!cart) {
    return { id: null, store: null, items: [], total: 0, count: 0 };
  }

  const items = cart.items.map((item) => {
    const options = item.chosen.map((choice) => ({
      id: choice.option.id,
      name: choice.option.name,
      additional_price: choice.option.additional_price
    }));
    const extras = redondear(options.reduce((sum, option) => sum + option.additional_price, 0));
    // price = precio de una unidad con sus opciones incluidas
    const price = redondear(item.product.price + extras);

    return {
      id: item.id,
      product_id: item.product_id,
      name: item.product.name,
      description: item.product.description,
      base_price: item.product.price,
      price,
      options,
      quantity: item.quantity,
      notes: item.notes,
      subtotal: redondear(price * item.quantity),
      available: item.product.available,
      preparation_time: item.product.preparation_time
    };
  });

  return {
    id: cart.id,
    store: {
      id: cart.store.id,
      name: cart.store.commercial_name,
      campus_location: cart.store.campus_location
    },
    items,
    total: redondear(items.reduce((sum, item) => sum + item.subtotal, 0)),
    count: items.reduce((sum, item) => sum + item.quantity, 0)
  };
};

const parseQuantity = (value, fallback) => {
  const quantity = value === undefined ? fallback : value;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw serviceError(400, 'INVALID_QUANTITY', `La cantidad debe ser un entero entre 1 y ${MAX_QUANTITY}`);
  }

  return quantity;
};

/**
 * Valida las opciones elegidas contra los grupos del producto:
 * deben pertenecer al producto, no repetirse, respetar "única" y cubrir los grupos obligatorios.
 * Devuelve los ids ordenados.
 */
const parseOptions = async (productId, value) => {
  const chosen = value === undefined || value === null ? [] : value;

  if (!Array.isArray(chosen) || chosen.some((id) => !Number.isInteger(id) || id < 1)) {
    throw serviceError(400, 'INVALID_OPTIONS', 'Las opciones elegidas son inválidas');
  }

  if (new Set(chosen).size !== chosen.length) {
    throw serviceError(400, 'INVALID_OPTIONS', 'Hay opciones repetidas');
  }

  const groups = await optionGroupRepository.findAllByProduct(productId);
  const known = new Set(groups.flatMap((group) => group.options.map((option) => option.id)));

  if (chosen.some((id) => !known.has(id))) {
    throw serviceError(400, 'INVALID_OPTIONS', 'Una opción elegida no pertenece a este producto');
  }

  for (const group of groups) {
    const count = group.options.filter((option) => chosen.includes(option.id)).length;

    if (group.selection_type === 'unica' && count > 1) {
      throw serviceError(400, 'INVALID_OPTIONS', `En «${group.name}» solo puedes elegir una opción`);
    }

    if (group.is_required && count === 0) {
      throw serviceError(400, 'OPTION_REQUIRED', `Elige una opción en «${group.name}»`);
    }
  }

  return [...chosen].sort((a, b) => a - b);
};

const sameOptions = (item, optionIds) => {
  const current = item.chosen.map((choice) => choice.product_option_id).sort((a, b) => a - b);

  return current.length === optionIds.length && current.every((id, index) => id === optionIds[index]);
};

const parseNotes = (value) => {
  if (value === undefined || value === null) return null;

  const notes = String(value).trim();

  if (notes.length > 120) {
    throw serviceError(400, 'INVALID_NOTES', 'La nota admite máximo 120 caracteres');
  }

  return notes === '' ? null : notes;
};

/**
 * Obtener el carrito del comensal
 */
export const fetchCart = async (dinerId) => {
  return toView(await cartRepository.findByDiner(dinerId));
};

/**
 * Agregar un producto al carrito.
 * El carrito es de un solo local: si ya tiene productos de otro local responde 409.
 */
export const addItem = async (dinerId, data = {}) => {
  const productId = Number(data.product_id);

  if (!Number.isInteger(productId) || productId < 1) {
    throw serviceError(400, 'INVALID_PRODUCT', 'Producto inválido');
  }

  const quantity = parseQuantity(data.quantity, 1);
  const notes = parseNotes(data.notes);

  const product = await productRepository.findById(productId);
  const store = product ? await storeRepository.findById(product.store_id) : null;

  if (!product || !store || store.operative_status !== 'activo') {
    throw serviceError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado');
  }

  if (!product.available) {
    throw serviceError(409, 'PRODUCT_UNAVAILABLE', 'El producto está agotado');
  }

  const optionIds = await parseOptions(product.id, data.options);

  let cart = await cartRepository.findByDiner(dinerId);

  if (cart && cart.store_id !== store.id) {
    if (cart.items.length > 0) {
      throw serviceError(
        409,
        'CART_OTHER_STORE',
        `Tu carrito tiene productos de ${cart.store.commercial_name}. Vacíalo para pedir en otro local`
      );
    }
    // Carrito vacío de otro local: se reutiliza para este local
    await cartRepository.changeStore(cart, store.id);
  }

  if (!cart) {
    await cartRepository.create({ diner_id: dinerId, store_id: store.id });
  }

  cart = await cartRepository.findByDiner(dinerId);

  // Mismo producto, misma nota y mismas opciones: se suma la cantidad
  const candidates = await cartRepository.findItems(cart.id, product.id, notes);
  const existing = candidates.find((item) => sameOptions(item, optionIds));

  if (existing) {
    const total = existing.quantity + quantity;

    if (total > MAX_QUANTITY) {
      throw serviceError(400, 'INVALID_QUANTITY', `Máximo ${MAX_QUANTITY} unidades por producto`);
    }

    await cartRepository.updateItem(existing, { quantity: total });
  } else {
    await cartRepository.createItem({
      cart_id: cart.id,
      product_id: product.id,
      quantity,
      notes
    }, optionIds);
  }

  return await fetchCart(dinerId);
};

/**
 * Cambiar la cantidad de un ítem del carrito
 */
export const updateItem = async (dinerId, itemId, data = {}) => {
  const cart = await cartRepository.findByDiner(dinerId);
  const item = cart ? await cartRepository.findItemByIdAndCart(itemId, cart.id) : null;

  if (!item) {
    throw serviceError(404, 'CART_ITEM_NOT_FOUND', 'El producto no está en tu carrito');
  }

  await cartRepository.updateItem(item, { quantity: parseQuantity(data.quantity) });

  return await fetchCart(dinerId);
};

/**
 * Quitar un ítem del carrito (si era el último, se elimina el carrito)
 */
export const removeItem = async (dinerId, itemId) => {
  const cart = await cartRepository.findByDiner(dinerId);
  const item = cart ? await cartRepository.findItemByIdAndCart(itemId, cart.id) : null;

  if (!item) {
    throw serviceError(404, 'CART_ITEM_NOT_FOUND', 'El producto no está en tu carrito');
  }

  await cartRepository.deleteItem(item);

  if (cart.items.length === 1) {
    await cartRepository.deleteByDiner(dinerId);
  }

  return await fetchCart(dinerId);
};

/**
 * Vaciar el carrito
 */
export const clearCart = async (dinerId) => {
  await cartRepository.deleteByDiner(dinerId);

  return toView(null);
};
