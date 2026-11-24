import cartRepository from '../repositories/carts_repository.js';
import productRepository from '../repositories/products_repository.js';
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
    const price = item.product.price;

    return {
      id: item.id,
      product_id: item.product_id,
      name: item.product.name,
      description: item.product.description,
      price,
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

  const existing = await cartRepository.findItem(cart.id, product.id, notes);

  if (existing) {
    // Mismo producto con la misma nota: se suma la cantidad
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
    });
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
