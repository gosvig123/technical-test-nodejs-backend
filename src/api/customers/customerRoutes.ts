import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../../services/customers/customerService.js';
import { Router, Request, Response } from 'express';

// Initialize router without options
const router = Router();

// GET all customers
router.get('/', async (_req: Request, res: Response) => {
  try {
    const customers = await getCustomers();
    res.json(customers);
  } catch (error) {
    console.error('Error in GET /customers route:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve customers'
    });
  }
});

// GET customer by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const customer = await getCustomerById(id);

    if (!customer) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Customer with ID ${id} not found`
      });
    }

    res.json(customer);
  } catch (error) {
    console.error(`Error in GET /customers/${req.params.id} route:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve customer'
    });
  }
});

// CREATE a new customer
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name and email are required fields'
      });
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid email format'
      });
    }

    const newCustomer = await createCustomer({ name, email });
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error in POST /customers route:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create customer'
    });
  }
});

// UPDATE a customer
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    // normally we would have some middleware to check who is trying to update what
    const { name, email } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid customer ID format'
      });
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid email format'
        });
      }
    }

    // Check if customer exists
    const existingCustomer = await getCustomerById(id);
    if (!existingCustomer) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Customer with ID ${id} not found`
      });
    }

    const updatedCustomer = await updateCustomer(id, { name, email });
    res.json(updatedCustomer);
  } catch (error) {
    console.error(`Error in PUT /customers/${req.params.id} route:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update customer'
    });
  }
});

// DELETE a customer
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid customer ID format'
      });
    }

    // Check if customer exists
    const existingCustomer = await getCustomerById(id);
    if (!existingCustomer) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Customer with ID ${id} not found`
      });
    }

    const deletedCustomer = await deleteCustomer(id);
    res.json({
      message: `Customer with ID ${id} successfully deleted`,
      customer: deletedCustomer
    });
  } catch (error) {
    console.error(`Error in DELETE /customers/${req.params.id} route:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete customer'
    });
  }
});

export default router;
