import { customer } from '../../../generated/prisma/index.js';
import prisma from '../../db/index.js';

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

export const getCustomerById = async (id: number): Promise<customer | null> => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        address: true,
        orders: true
      }
    });
    return customer;
  } catch (error) {
    console.error(`Error fetching customer with id ${id}:`, error);
    throw new Error(`Could not fetch customer with id ${id}`);
  }
};

type CustomerCreateInput = {
  name: string;
  email: string;
};

export const createCustomer = async (data: CustomerCreateInput): Promise<customer> => {
  try {
    const newCustomer = await prisma.customer.create({
      data
    });
    return newCustomer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Could not create customer');
  }
};

type CustomerUpdateInput = {
  name?: string;
  email?: string;
};

export const updateCustomer = async (id: number, data: CustomerUpdateInput): Promise<customer> => {
  try {
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data
    });
    return updatedCustomer;
  } catch (error) {
    console.error(`Error updating customer with id ${id}:`, error);
    throw new Error(`Could not update customer with id ${id}`);
  }
};

export const deleteCustomer = async (id: number): Promise<customer> => {
  try {
    const deletedCustomer = await prisma.customer.delete({
      where: { id }
    });
    return deletedCustomer;
  } catch (error) {
    console.error(`Error deleting customer with id ${id}:`, error);
    throw new Error(`Could not delete customer with id ${id}`);
  }
};