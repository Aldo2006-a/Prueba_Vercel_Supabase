import { Store, StoreSchedule } from '../models/associations.js';

const includeSchedules = { model: StoreSchedule, as: 'schedules' };

/**
 * Obtener locales (con opciones: where, order, etc.) junto con su horario
 */
const findAll = async (options = {}) => {
  return await Store.findAll({ ...options, include: [includeSchedules] });
};

/**
 * Obtener local por ID (con su horario)
 */
const findById = async (id) => {
  return await Store.findByPk(id, { include: [includeSchedules] });
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
