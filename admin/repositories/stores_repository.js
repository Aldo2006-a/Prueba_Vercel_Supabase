import { Store } from '../models/associations.js';

/**
 * Obtener locales (con opciones: where, order, etc.)
 */
const findAll = async (options = {}) => {
  return await Store.findAll(options);
};

/**
 * Obtener local por ID
 */
const findById = async (id) => {
  return await Store.findByPk(id);
};

/**
 * Obtener el local de un usuario (rol enterprises)
 */
const findByUserId = async (userId) => {
  return await Store.findOne({ where: { user_id: userId } });
};

const storeRepository = {
  findAll,
  findById,
  findByUserId
};

export default storeRepository;
