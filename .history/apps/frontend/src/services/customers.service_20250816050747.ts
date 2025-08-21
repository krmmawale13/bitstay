import axios, { AxiosError } from 'axios';

const API_URL = '/api/customers';

export const getCustomers = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || err.message);
    }
    throw new Error('An unexpected error occurred while fetching customers');
  }
};

export const getCustomerById = async (id: number) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || err.message);
    }
    throw new Error(`An unexpected error occurred while fetching customer ID ${id}`);
  }
};

export const createCustomer = async (data: any) => {
  try {
    const response = await axios.post(API_URL, data);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || err.message);
    }
    throw new Error('An unexpected error occurred while creating a customer');
  }
};

export const updateCustomer = async (id: number, data: any) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || err.message);
    }
    throw new Error(`An unexpected error occurred while updating customer ID ${id}`);
  }
};

export const deleteCustomer = async (id: number) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || err.message);
    }
    throw new Error(`An unexpected error occurred while deleting customer ID ${id}`);
  }
};
