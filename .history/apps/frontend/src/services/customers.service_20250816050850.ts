import axios from 'axios';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export type UpsertCustomer = Omit<Customer, 'id'>;

const API_URL = '/api/customers';

function isAxiosError(error: any): error is { response?: { data?: { message?: string } }; message: string } {
  return error && typeof error === 'object' && 'message' in error;
}

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (err: unknown) {
    if (isAxiosError(err)) {
      throw new Error(err.response?.data?.message || err.message);
    }
    throw new Error('Unexpected error while fetching customers');
  }
};

export const getCustomerById = async (id: number): Promise<Customer> => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (err: unknown) {
    if (isAxiosError(err)) {
      throw new Error(err.response?.data?.message || err.message);
    }
    throw new Error(`Unexpected error while fetching customer ID ${id}`);
  }
};

export const createCustomer = async (data: UpsertCustomer): Promise<Customer> => {
  try {
    const response = await axios.post(API_URL, data);
    return response.data;
  } catch (err: unknown) {
    if (isAxiosError(err)) {
      throw new Error(err.response?.data?.message || err.message);
    }
    throw new Error('Unexpected error while creating a customer');
  }
};

export const updateCustomer = async (id: number, data: UpsertCustomer): Promise<Customer> => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
  } catch (err: unknown) {
    if (isAxiosError(err)) {
      throw new Error(err.response?.data?.message || err.message);
    }
    throw new Error(`Unexpected error while updating customer ID ${id}`);
  }
};

export const deleteCustomer = async (id: number): Promise<{ success: boolean }> => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (err: unknown) {
    if (isAxiosError(err)) {
      throw new Error(err.response?.data?.message || err.message);
    }
    throw new Error(`Unexpected error while deleting customer ID ${id}`);
  }
};
