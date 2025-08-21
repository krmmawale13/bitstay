// src/services/customers.service.ts
import http from "@/lib/http";

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
  const res = await http.get<Customer[]>("/customers");
  return res.data;
}

// GET ONE
export async function getCustomerById(id: string | number): Promise<Customer | null> {
  const res = await http.get<Customer | null>(`/customers/${id}`);
  return res.data ?? null;
}

// CREATE
export async function createCustomer(payload: Partial<Customer>): Promise<Customer> {
  const data = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
    address: payload.address ?? null,
  };
  const res = await http.post<Customer>("/customers", data);
  return res.data;
}

// UPDATE
export async function updateCustomer(id: string | number, payload: Partial<Customer>): Promise<Customer> {
  const data = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
    address: payload.address ?? null,
  };
  const res = await http.put<Customer>(`/customers/${id}`, data);
  return res.data;
}

// DELETE
export async function deleteCustomer(id: string | number): Promise<{ success: boolean }> {
  const res = await http.delete<{ success: boolean }>(`/customers/${id}`);
  return res.data;
}
