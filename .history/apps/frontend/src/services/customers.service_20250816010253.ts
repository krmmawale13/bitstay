// apps/frontend/src/services/customers.service.ts
import axios from "axios";

axios.defaults.withCredentials = true;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1";
const CUSTOMERS_URL = `${API_BASE}/customers`;

// Match DB schema fields exactly
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

// Helper: attach Authorization + Tenant headers
function authHeaders(tenantId?: number) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (tenantId) headers["x-tenant-id"] = tenantId.toString();

  return { headers };
}

// ------------------ LIST ------------------
export async function getCustomers(tenantId?: number): Promise<Customer[]> {
  const url = tenantId ? `${CUSTOMERS_URL}` : CUSTOMERS_URL;
  const res = await axios.get<Customer[]>(url, authHeaders(tenantId));
  console.log("Customers API raw response:", res.data);
  return res.data;
}

// ------------------ GET ONE ------------------
export async function getCustomerById(
  id: string | number,
  tenantId?: number
): Promise<Customer | null> {
  const url = `${CUSTOMERS_URL}/${id}`;
  const res = await axios.get<Customer | null>(url, authHeaders(tenantId));
  return res.data ?? null;
}

// ------------------ CREATE ------------------
export async function createCustomer(
  payload: Partial<Customer>
): Promise<Customer> {
  const data = {
    tenantId: payload.tenantId,
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
    address: payload.address ?? null,
  };
  const res = await axios.post<Customer>(
    CUSTOMERS_URL,
    data,
    authHeaders(payload.tenantId)
  );
  return res.data;
}

// ------------------ UPDATE ------------------
export async function updateCustomer(
  id: string | number,
  payload: Partial<Customer>
): Promise<Customer> {
  const data = {
    tenantId: payload.tenantId,
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
    address: payload.address ?? null,
  };
  const res = await axios.put<Customer>(
    `${CUSTOMERS_URL}/${id}`,
    data,
    authHeaders(payload.tenantId)
  );
  return res.data;
}

// ------------------ DELETE ------------------
export async function deleteCustomer(
  id: string | number,
  tenantId?: number
): Promise<{ success: boolean }> {
  const url = `${CUSTOMERS_URL}/${id}`;
  const res = await axios.delete<{ success: boolean }>(
    url,
    authHeaders(tenantId)
  );
  return res.data;
}
