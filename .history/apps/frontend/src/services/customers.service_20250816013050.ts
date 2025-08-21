// apps/frontend/src/services/customers.service.ts
import axios from "axios";

axios.defaults.withCredentials = true;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1";
const CUSTOMERS_URL = `${API_BASE}/customers`;

// DB schema type mapping
export type Customer = {
  id: number;
  tenantId: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

// Common auth + tenant headers
function authHeaders(tenantId?: number) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (tenantId) headers["x-tenant-id"] = String(tenantId);

  return { headers };
}

// ------------------ LIST ------------------
export async function getCustomers(tenantId: number): Promise<Customer[]> {
  const res = await axios.get<Customer[]>(
    CUSTOMERS_URL,
    authHeaders(tenantId)
  );
  console.log("📦 Customers List:", res.data);
  return res.data;
}

// ------------------ GET ONE ------------------
export async function getCustomerById(
  id: number,
  tenantId: number
): Promise<Customer | null> {
  const res = await axios.get<Customer>(
    `${CUSTOMERS_URL}/${id}`,
    authHeaders(tenantId)
  );
  console.log(`📦 Customer[${id}]:`, res.data);
  return res.data ?? null;
}

// ------------------ CREATE ------------------
export async function createCustomer(
  payload: Omit<Customer, "id" | "createdAt" | "updatedAt">
): Promise<Customer> {
  const res = await axios.post<Customer>(
    CUSTOMERS_URL,
    {
      tenantId: payload.tenantId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone ?? null,
      address: payload.address ?? null,
    },
    authHeaders(payload.tenantId)
  );
  console.log("✅ Customer Created:", res.data);
  return res.data;
}

// ------------------ UPDATE ------------------
export async function updateCustomer(
  id: number,
  payload: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>
): Promise<Customer> {
  const res = await axios.put<Customer>(
    `${CUSTOMERS_URL}/${id}`,
    {
      tenantId: payload.tenantId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone ?? null,
      address: payload.address ?? null,
    },
    authHeaders(payload.tenantId)
  );
  console.log(`✏️ Customer Updated[${id}]:`, res.data);
  return res.data;
}

// ------------------ DELETE ------------------
export async function deleteCustomer(
  id: number,
  tenantId: number
): Promise<{ success: boolean }> {
  const res = await axios.delete<{ success: boolean }>(
    `${CUSTOMERS_URL}/${id}`,
    authHeaders(tenantId)
  );
  console.log(`🗑️ Customer Deleted[${id}]`);
  return res.data;
}
