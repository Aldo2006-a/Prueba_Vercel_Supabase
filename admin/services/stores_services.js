import storeRepository from '../repositories/stores_repository.js';
import { normalizeSchedule, storeStatus } from './schedule_rules.js';

/**
 * Local + su horario y si está abierto ahora (hora de Lima)
 */
const withSchedule = (store) => {
  const { schedules, ...data } = store.toJSON();
  const schedule = normalizeSchedule(schedules);

  return { ...data, schedule, ...storeStatus(schedule) };
};

/**
 * Obtener los locales activos (los que ve el comensal)
 */
export const fetchAllActive = async () => {
  const stores = await storeRepository.findAll({
    where: { operative_status: 'activo' },
    order: [['id', 'ASC']]
  });

  return stores.map(withSchedule);
};

/**
 * Obtener un local activo por su ID
 */
export const fetchActiveById = async (id) => {
  const store = await storeRepository.findById(id);

  if (!store || store.operative_status !== 'activo') {
    return null;
  }

  return withSchedule(store);
};

/**
 * Obtener el local que pertenece a un usuario
 */
export const fetchByUserId = async (userId) => {
  const store = await storeRepository.findByUserId(userId);

  if (!store) {
    return null;
  }

  return store.toJSON();
};
