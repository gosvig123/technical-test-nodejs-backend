import { Router } from 'express';
import customerRoutes from './api/customers/customerRoutes.js';
import agentRoutes from './api/agent/agentRoutes.js';

const router = Router();

router.use('/customers', customerRoutes);
router.use('/agent', agentRoutes);


export default router;