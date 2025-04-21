import { Router } from 'express';
import { getCustomers } from '../../services/customerService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const customers = await getCustomers();
    res.json(customers);
  } catch (error) {
    console.error('Error in /customers route:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;