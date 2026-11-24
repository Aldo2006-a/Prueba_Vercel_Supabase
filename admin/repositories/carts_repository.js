import { Cart, CartItem, Product, Store } from '../models/associations.js';

const cartInclude = [
  { model: Store, as: 'store', attributes: ['id', 'commercial_name', 'campus_location', 'operative_status'] },
  {
    model: CartItem,
    as: 'items',
    include: [{ model: Product, as: 'product' }]
  }
];

/**
 * Carrito del comensal con su local, ítems y productos
 */
const findByDiner = async (dinerId) => {
  return await Cart.findOne({
    where: { diner_id: dinerId },
    include: cartInclude,
    order: [[{ model: CartItem, as: 'items' }, 'id', 'ASC']]
  });
};

const create = async (data) => {
  return await Cart.create(data);
};

const changeStore = async (cart, storeId) => {
  return await cart.update({ store_id: storeId });
};

const deleteByDiner = async (dinerId) => {
  return await Cart.destroy({ where: { diner_id: dinerId } });
};

const findItem = async (cartId, productId, notes) => {
  return await CartItem.findOne({
    where: { cart_id: cartId, product_id: productId, notes }
  });
};

const findItemByIdAndCart = async (id, cartId) => {
  return await CartItem.findOne({ where: { id, cart_id: cartId } });
};

const createItem = async (data) => {
  return await CartItem.create(data);
};

const updateItem = async (item, data) => {
  return await item.update(data);
};

const deleteItem = async (item) => {
  return await item.destroy();
};

const deleteItemsByCart = async (cartId) => {
  return await CartItem.destroy({ where: { cart_id: cartId } });
};

const cartRepository = {
  findByDiner,
  create,
  changeStore,
  deleteByDiner,
  findItem,
  findItemByIdAndCart,
  createItem,
  updateItem,
  deleteItem,
  deleteItemsByCart
};

export default cartRepository;
