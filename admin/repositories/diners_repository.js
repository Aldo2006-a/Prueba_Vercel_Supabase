import { Diner } from '../models/associations.js';

/**
 * Obtener el perfil de comensal de un usuario
 */
const findByUserId = async (userId) => {
  return await Diner.findOne({ where: { user_id: userId } });
};

const dinerRepository = {
  findByUserId
};

export default dinerRepository;
