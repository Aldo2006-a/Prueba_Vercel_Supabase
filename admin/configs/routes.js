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
import * as profileApis from '../apis/profile_apis.js';
import * as cartApis from '../apis/carts_apis.js';
import * as orderApis from '../apis/orders_apis.js';
import * as scheduleApis from '../apis/schedules_apis.js';
import * as registrationApis from '../apis/registration_apis.js';
import * as storeRequestApis from '../apis/store_requests_apis.js';
import { loadMyDiner } from '../apis/diners_apis.js';
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

// api registro (público): crear cuenta de comensal y solicitar el registro de un local
router.post('/api/v1/register/comensal', registrationApis.registerDiner);
router.post('/api/v1/register/local', registrationApis.registerStore);

// api solicitudes de local (solo owner): revisar, aprobar u observar
router.get('/api/v1/store-requests', requireRole('owner'), storeRequestApis.listStoreRequests);
router.patch('/api/v1/store-requests/:id/status', requireRole('owner'), storeRequestApis.changeStoreRequestStatus);

// api locales y carta (cualquier usuario con sesión)
router.get('/api/v1/me', requireAuth, profileApis.getMe);
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

// api comensal: mi carrito y mis pedidos (solo comensal, sobre SU perfil)
router.get('/api/v1/my-cart', requireRole('comensal'), loadMyDiner, cartApis.getMyCart);
router.post('/api/v1/my-cart/items', requireRole('comensal'), loadMyDiner, cartApis.addToMyCart);
router.patch('/api/v1/my-cart/items/:id', requireRole('comensal'), loadMyDiner, cartApis.updateMyCartItem);
router.delete('/api/v1/my-cart/items/:id', requireRole('comensal'), loadMyDiner, cartApis.deleteMyCartItem);
router.delete('/api/v1/my-cart', requireRole('comensal'), loadMyDiner, cartApis.clearMyCart);

router.get('/api/v1/my-orders', requireRole('comensal'), loadMyDiner, orderApis.listMyOrders);
router.post('/api/v1/my-orders', requireRole('comensal'), loadMyDiner, orderApis.createMyOrder);

// api mi local: horario de atención (solo enterprises, sobre SU local)
router.get('/api/v1/my-store/schedule', requireRole('enterprises'), storeApis.loadMyStore, scheduleApis.getMySchedule);
router.put('/api/v1/my-store/schedule', requireRole('enterprises'), storeApis.loadMyStore, scheduleApis.saveMySchedule);

// api mi local: pedidos (solo enterprises, sobre SU local)
router.get('/api/v1/my-store/orders', requireRole('enterprises'), storeApis.loadMyStore, orderApis.listStoreOrders);
router.get('/api/v1/my-store/orders/by-code/:code', requireRole('enterprises'), storeApis.loadMyStore, orderApis.getStoreOrderByCode);
router.patch('/api/v1/my-store/orders/:id/status', requireRole('enterprises'), storeApis.loadMyStore, orderApis.changeStoreOrderStatus);

router.post('/enterprises/logout', enterprises.salir);
router.post('/comensales/logout', comensales.salir);

export default router;
