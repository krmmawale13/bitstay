// src/services/customers.service.ts
import axios from 'axios';

axios.defaults.withCredentials = true;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api/v1';
const CUSTOMERS_URL = `${API_BASE}/customers`;

export type Customer = {
  id: number;
  tenantId?: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

// LIST
export async function getCustomers(): Promise<Customer[]> {
  const res = await axios.get(CUSTOMERS_URL);
  return res.data;
}

// GET ONE
export async function getCustomerById(id: string | number): Promise<Customer | null> {
  const res = await axios.get(`${CUSTOMERS_URL}/${id}`);
  return res.data ?? null;
}

// CREATE
export async function createCustomer(payload: Partial<Customer>): Promise<Customer> {
  // only send allowed fields
  const data = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
    // address is optional; backend may ignore if normalized to addresses table
    ...(payload.address ? { address: payload.address } : {}),
  };
  const res = await axios.post(CUSTOMERS_URL, data);
  return res.data;
}

// UPDATE
export async function updateCustomer(id: string | number, payload: Partial<Customer>): Promise<Customer> {
  const data = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
    ...(payload.address ? { address: payload.address } : {}),
  };
  const res = await axios.put(`${CUSTOMERS_URL}/${id}`, data);
  return res.data;
}

// DELETE
export async function deleteCustomer(id: string | number): Promise<{ success: boolean } | any> {
  const res = await axios.delete(`${CUSTOMERS_URL}/${id}`);
  return res.data;
}
