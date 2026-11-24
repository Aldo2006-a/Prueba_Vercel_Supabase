// admin/configs/routes.js

import { Router } from 'express';

import * as owners from '../controllers/owner_controllers.js';
import * as enterprises from '../controllers/enterprise_controllers.js';
import * as comensales from '../controllers/comensal_controllers.js';
import { requireRole } from '../../configs/middlewares.js';

const router = Router();

// Cada panel es una app React con su propio router interno.
// Todas sus URLs entregan la misma vista base (controlador "panel");
// para agregar una pantalla nueva, súmala a la lista de su panel.

// owner
router.get([
  '/owner',
  '/owner/tablero',
  '/owner/ventas',
  '/owner/comensales',
  '/owner/solicitudes',
  '/owner/ranking',
], requireRole('owner'), owners.panel);

// enterprises
router.get([
  '/enterprises',
  '/enterprises/bandeja',
  '/enterprises/resumenDia',
  '/enterprises/entrega',
  '/enterprises/opcionesAgregados',
  '/enterprises/Micarta',
  '/enterprises/NuevoProducto',
  '/enterprises/agotados',
  '/enterprises/perfil',
  '/enterprises/PerfilVistaPrevia',
  '/enterprises/horario',
  '/enterprises/resenas',
], requireRole('enterprises'), enterprises.panel);

// comensal
router.get([
  '/comensales',
  '/comensales/localescomensal',
  '/comensales/pedidos',
  '/comensales/calificaciones',
  '/comensales/micuenta',
  '/comensales/carrito',
], requireRole('comensal'), comensales.panel);

router.post('/enterprises/logout', enterprises.salir);
router.post('/comensales/logout', comensales.salir);

export default router;
