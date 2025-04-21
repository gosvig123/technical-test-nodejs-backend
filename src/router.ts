import { Router } from 'express';
import customerRoutes from './api/customers/customerRoutes.js';

const router = Router();

router.use('/customers', customerRoutes);


export default router;