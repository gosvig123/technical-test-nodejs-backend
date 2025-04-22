import { Router } from 'express';
import customerRoutes from './api/customers/customerRoutes.js';
import addressRoutes from './api/addresses/addressRoutes.js';
import orderRoutes from './api/orders/orderRoutes.js';
import authenticateApiKey from './middleware/auth.js';

const router = Router();
router.use(authenticateApiKey)

router.use('/customers', customerRoutes);
router.use('/addresses', addressRoutes);
router.use('/orders', orderRoutes);

export default router;