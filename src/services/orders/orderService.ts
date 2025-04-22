import { orders } from '../../../generated/prisma/index.js';
import prisma from '../../connector/index.js';

export const getOrdersByCustomerId = async (customerId: number): Promise<orders[]> => {
  try {
    const orders = await prisma.orders.findMany({
      where: { customer_id: customerId },
    });
    return orders;
  } catch (error) {
    console.error(`Error fetching orders for customer ${customerId}:`, error);
    throw new Error(`Could not fetch orders for customer ${customerId}`);
  }
};

export const getOrderById = async (id: number): Promise<orders | null> => {
  try {
    const order = await prisma.orders.findUnique({
      where: { id },
    });
    return order;
  } catch (error) {
    console.error(`Error fetching order with id ${id}:`, error);
    throw new Error(`Could not fetch order with id ${id}`);
  }
};

type OrderCreateInput = {
  customer_id: number;
  order_date?: Date;
  total_amount?: number; // Use number for Decimal in Prisma client
};

export const createOrder = async (data: OrderCreateInput): Promise<orders> => {
  try {
    const newOrder = await prisma.orders.create({
      data: {
        customer_id: data.customer_id,
        order_date: data.order_date,
        total_amount: data.total_amount,
      },
    });
    return newOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Could not create order');
  }
};

type OrderUpdateInput = {
  order_date?: Date;
  total_amount?: number; // Use number for Decimal in Prisma client
};

export const updateOrder = async (id: number, data: OrderUpdateInput): Promise<orders> => {
  try {
    const updatedOrder = await prisma.orders.update({
      where: { id },
      data: {
        order_date: data.order_date,
        total_amount: data.total_amount,
      },
    });
    return updatedOrder;
  } catch (error) {
    console.error(`Error updating order with id ${id}:`, error);
    throw new Error(`Could not update order with id ${id}`);
  }
};

export const deleteOrder = async (id: number): Promise<orders> => {
  try {
    const deletedOrder = await prisma.orders.delete({
      where: { id },
    });
    return deletedOrder;
  } catch (error) {
    console.error(`Error deleting order with id ${id}:`, error);
    throw new Error(`Could not delete order with id ${id}`);
  }
};