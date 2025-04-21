import { getCustomers } from '../../services/customerService.js';
import { Request, Response, Router } from 'express';

const router = Router();
router.get('/', async (_req: Request, res: Response) => {
  try {
    const customers = await getCustomers();
    res.json(customers);
  } catch (error) {
    console.error('Error in /customers route:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;