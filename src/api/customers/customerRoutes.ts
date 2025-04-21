import { getCustomers } from '../../services/customerService.js';
import { NextFunction, Request, Response, Router } from 'express';
import  authenticateApiKey  from '../../middleware/auth.js';

// Initialize router without options
const router = Router();

// Apply authentication middleware to all routes
router.use((req: Request, res: Response, next: NextFunction) => {
  authenticateApiKey(req, res, next);
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const customers = await getCustomers();
    res.json(customers);
  } catch (error) {
    console.error('Error in /customers route:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve customers'
    });
  }
});

export default router;
