// apps/frontend/src/services/customers.service.ts
import axios from "axios";

axios.defaults.withCredentials = true;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1";
const CUSTOMERS_URL = `${API_BASE}/customers`;

/** Optional nested address type (backend me relation ho to bhi safe) */
export type Address = {
  id?: number;
  line1: string;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

/** Customer type — UI ke hisaab se tenantId + address string bhi rakha hai */
export type Customer = {
  id: number;
  tenantId?: number;           // optional: backend single-tenant me server set karega
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;     // simple flat address (UI ke liye)
  addresses?: Address[];       // optional nested addresses (backend include kare to)
  createdAt?: string;
  updatedAt?: string;
};

/** Authorization + Tenant headers (jaisa pehle tha, kuch hataaya nahi) */
function authHeaders(tenantId?: number) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (tenantId) headers["x-tenant-id"] = tenantId.toString();

  return { headers };
}

/** axios version-agnostic error guard (isAxiosError pe dependency nahi) */
function isAxiosLike(
  err: unknown
): err is { response?: { status?: number; data?: any }; message?: string } {
  return typeof err === "object" && err !== null && "message" in err;
}

/** Centralized error thrower — always throws (never returns) */
function handleApiError(error: unknown): never {
  if (isAxiosLike(error)) {
    const status = error.response?.status;
    const data = error.response?.data as any;
    const message =
      (data && (data.message || data.error)) ||
      (typeof error.message === "string" ? error.message : "") ||
      "Something went wrong while communicating with the server.";
    // keep rich log for debugging
    // eslint-disable-next-line no-console
    console.error("API Error:", { status, message, data });
    throw new Error(message);
  }
  // eslint-disable-next-line no-console
  console.error("Unexpected Error:", error);
  throw new Error("An unexpected error occurred.");
}

// ------------------ LIST ------------------
export async function getCustomers(tenantId?: number): Promise<Customer[]> {
  try {
    const res = await axios.get<Customer[]>(
      CUSTOMERS_URL,
      authHeaders(tenantId)
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ------------------ GET ONE ------------------
export async function getCustomerById(
  id: string | number,
  tenantId?: number
): Promise<Customer | null> {
  try {
    const res = await axios.get<Customer>(
      `${CUSTOMERS_URL}/${id}`,
      authHeaders(tenantId)
    );
    return res.data ?? null;
  } catch (error) {
    handleApiError(error);
  }
}

// ------------------ CREATE ------------------
export async function createCustomer(
  payload: Partial<Customer>
): Promise<Customer> {
  try {
    const body = {
      tenantId: payload.tenantId, // backend ignore kare to bhi safe
      name: payload.name,
      email: payload.email,
      phone: payload.phone ?? null,
