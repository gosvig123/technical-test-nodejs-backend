import { Router, Request, Response } from 'express';
import {
  getAddressesByCustomerId,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../../services/addresses/addressService.js';

const router = Router();


// GET all addresses for a specific customer
router.get('/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.customerId);

    if (isNaN(customerId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid customer ID format',
      });
    }

    const addresses = await getAddressesByCustomerId(customerId);
    res.json(addresses);
  } catch (error) {
    console.error(`Error in GET /addresses/customer/${req.params.customerId} route:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve addresses',
    });
  }
});

// GET a single address by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid address ID format',
      });
    }

    const address = await getAddressById(id);

    if (!address) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Address with ID ${id} not found`,
      });
    }

    res.json(address);
  } catch (error) {
    console.error(`Error in GET /addresses/${req.params.id} route:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve address',
    });
  }
});

// CREATE a new address for a customer
router.post('/', async (req: Request, res: Response) => {
  try {
    const { customer_id, type, street, city, zip, country } = req.body;

    // Basic validation
    if (!customer_id || !type || !street || !city || !zip || !country) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'customer_id, type, street, city, zip, and country are required fields',
      });
    }

    const newAddress = await createAddress({ customer_id, type, street, city, zip, country });
    res.status(201).json(newAddress);
  } catch (error) {
    console.error('Error in POST /addresses route:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create address',
    });
  }
});

// UPDATE an address by ID
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { type, street, city, zip, country } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid address ID format',
      });
    }

    // Check if address exists
    const existingAddress = await getAddressById(id);
    if (!existingAddress) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Address with ID ${id} not found`,
      });
    }

    const updatedAddress = await updateAddress(id, { type, street, city, zip, country });
    res.json(updatedAddress);
  } catch (error) {
    console.error(`Error in PUT /addresses/${req.params.id} route:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update address',
    });
  }
});

// DELETE an address by ID
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid address ID format',
      });
    }

    // Check if address exists
    const existingAddress = await getAddressById(id);
    if (!existingAddress) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Address with ID ${id} not found`,
      });
    }

    const deletedAddress = await deleteAddress(id);
    res.json({
      message: `Address with ID ${id} successfully deleted`,
      address: deletedAddress,
    });
  } catch (error) {
    console.error(`Error in DELETE /addresses/${req.params.id} route:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete address',
    });
  }
});

export default router;