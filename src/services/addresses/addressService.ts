import { address } from '../../../generated/prisma/index.js';
import prisma from '../../db/index.js';

export const getAddressesByCustomerId = async (customerId: number): Promise<address[]> => {
  try {
    const addresses = await prisma.address.findMany({
      where: { customer_id: customerId },
    });
    return addresses;
  } catch (error) {
    console.error(`Error fetching addresses for customer ${customerId}:`, error);
    throw new Error(`Could not fetch addresses for customer ${customerId}`);
  }
};

export const getAddressById = async (id: number): Promise<address | null> => {
  try {
    const address = await prisma.address.findUnique({
      where: { id },
    });
    return address;
  } catch (error) {
    console.error(`Error fetching address with id ${id}:`, error);
    throw new Error(`Could not fetch address with id ${id}`);
  }
};

type AddressCreateInput = {
  customer_id: number;
  type: string; // Consider using an enum or union type if possible based on schema
  street: string;
  city: string;
  zip: string;
  country: string;
};

export const createAddress = async (data: AddressCreateInput): Promise<address> => {
  try {
    const newAddress = await prisma.address.create({
      data: {
        customer_id: data.customer_id,
        type: data.type,
        street: data.street,
        city: data.city,
        zip: data.zip,
        country: data.country,
      },
    });
    return newAddress;
  } catch (error) {
    console.error('Error creating address:', error);
    throw new Error('Could not create address');
  }
};

type AddressUpdateInput = {
  type?: string; // Consider using an enum or union type if possible based on schema
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
};

export const updateAddress = async (id: number, data: AddressUpdateInput): Promise<address> => {
  try {
    const updatedAddress = await prisma.address.update({
      where: { id },
      data,
    });
    return updatedAddress;
  } catch (error) {
    console.error(`Error updating address with id ${id}:`, error);
    throw new Error(`Could not update address with id ${id}`);
  }
};

export const deleteAddress = async (id: number): Promise<address> => {
  try {
    const deletedAddress = await prisma.address.delete({
      where: { id },
    });
    return deletedAddress;
  } catch (error) {
    console.error(`Error deleting address with id ${id}:`, error);
    throw new Error(`Could not delete address with id ${id}`);
  }
};