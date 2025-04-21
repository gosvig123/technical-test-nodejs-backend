import { Router, Request, Response } from 'express';
import {
  getOrdersByCustomerId,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} from '../../services/orders/orderService.js';
import authenticateApiKey from '../../middleware/auth.js';

const router = Router();

// Apply authentication middleware to all routes in this router
router.use(authenticateApiKey);

// GET all orders for a specific customer
router.get('/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.customerId);

    if (isNaN(customerId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid customer ID format',
      });
    }

    const orders = await getOrdersByCustomerId(customerId);
    res.json(orders);
  } catch (error) {
    console.error(`Error in GET /orders/customer/${req.params.customerId} route:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve orders',
    });
  }
});

// GET a single order by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid order ID format',
      });
    }

    const order = await getOrderById(id);

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Order with ID ${id} not found`,
      });
    }

    res.json(order);
  } catch (error) {
    console.error(`Error in GET /orders/${req.params.id} route:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve order',
    });
  }
});

// CREATE a new order for a customer
router.post('/', async (req: Request, res: Response) => {
  try {
    const { customer_id, order_date, total_amount } = req.body;

    // Basic validation
    if (!customer_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'customer_id is a required field',
      });
    }

    const newOrder = await createOrder({ customer_id, order_date, total_amount });
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error in POST /orders route:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create order',
    });
  }
});

// UPDATE an order by ID
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { order_date, total_amount } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid order ID format',
      });
    }

    // Check if order exists
    const existingOrder = await getOrderById(id);
    if (!existingOrder) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Order with ID ${id} not found`,
      });
    }

    const updatedOrder = await updateOrder(id, { order_date, total_amount });
    res.json(updatedOrder);
  } catch (error) {
    console.error(`Error in PUT /orders/${req.params.id} route:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update order',
    });
  }
});

// DELETE an order by ID
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid order ID format',
      });
    }

    // Check if order exists
    const existingOrder = await getOrderById(id);
    if (!existingOrder) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Order with ID ${id} not found`,
      });
    }

    const deletedOrder = await deleteOrder(id);
    res.json({
      message: `Order with ID ${id} successfully deleted`,
      order: deletedOrder,
    });
  } catch (error) {
    console.error(`Error in DELETE /orders/${req.params.id} route:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete order',
    });
  }
});

export default router;