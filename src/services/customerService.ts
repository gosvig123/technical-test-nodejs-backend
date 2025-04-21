import { customer } from '../../generated/prisma/index.js';
import prisma from '../db/index.js';

export const getCustomers = async (): Promise<customer[]> => {
  try {
    // Assuming you have a 'customer' model defined in your prisma.schema
    const customers = await prisma.customer.findMany();
    return customers;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Could not fetch customers');
  }
};