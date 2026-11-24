// admin/configs/routes.js

import { Router } from 'express';

import * as owners from '../controllers/owner_controllers.js';
import * as enterprises from '../controllers/enterprise_controllers.js';
import * as comensales from '../controllers/comensal_controllers.js';
import * as roleApis from '../apis/roles_apis.js';
import * as userApis from '../apis/users_apis.js';
import * as storeApis from '../apis/stores_apis.js';
import * as categoryApis from '../apis/categories_apis.js';
import * as productApis from '../apis/products_apis.js';
import { requireRole, requireAuth } from '../../configs/middlewares.js';

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

// api roles y users (solo owner)
router.get('/api/v1/roles', requireRole('owner'), roleApis.listRoles);
router.get('/api/v1/roles/:id', requireRole('owner'), roleApis.getRoleById);
router.get('/api/v1/users', requireRole('owner'), userApis.listUsers);
router.get('/api/v1/users/:id', requireRole('owner'), userApis.getUserById);

// api locales y carta (cualquier usuario con sesión)
router.get('/api/v1/stores', requireAuth, storeApis.listStores);
router.get('/api/v1/stores/:id', requireAuth, storeApis.getStoreById);
router.get('/api/v1/stores/:id/products', requireAuth, productApis.listStoreProducts);

// api mi local: categorías y productos (solo enterprises, sobre SU local)
router.get('/api/v1/my-store', requireRole('enterprises'), storeApis.loadMyStore, storeApis.getMyStore);

router.get('/api/v1/my-store/categories', requireRole('enterprises'), storeApis.loadMyStore, categoryApis.listMyCategories);
router.post('/api/v1/my-store/categories', requireRole('enterprises'), storeApis.loadMyStore, categoryApis.createMyCategory);
router.put('/api/v1/my-store/categories/:id', requireRole('enterprises'), storeApis.loadMyStore, categoryApis.updateMyCategory);
router.delete('/api/v1/my-store/categories/:id', requireRole('enterprises'), storeApis.loadMyStore, categoryApis.deleteMyCategory);

router.get('/api/v1/my-store/products', requireRole('enterprises'), storeApis.loadMyStore, productApis.listMyProducts);
router.post('/api/v1/my-store/products', requireRole('enterprises'), storeApis.loadMyStore, productApis.createMyProduct);
router.get('/api/v1/my-store/products/:id', requireRole('enterprises'), storeApis.loadMyStore, productApis.getMyProductById);
router.put('/api/v1/my-store/products/:id', requireRole('enterprises'), storeApis.loadMyStore, productApis.updateMyProduct);
router.delete('/api/v1/my-store/products/:id', requireRole('enterprises'), storeApis.loadMyStore, productApis.deleteMyProduct);

router.post('/enterprises/logout', enterprises.salir);
router.post('/comensales/logout', comensales.salir);

export default router;
