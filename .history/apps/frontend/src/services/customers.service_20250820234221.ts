// apps/frontend/src/services/customers.service.ts
import axios from "axios";

axios.defaults.withCredentials = true;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1";
const CUSTOMERS_URL = `${API_BASE}/customers`;

// ------------------ TYPES ------------------
export type Address = {
  id?: number;
  line1: string;
  line2?: string | null;
  city?: string | null;
  stateId?: number | null;
  districtId?: number | null;
  pincode?: string | null;
  // legacy support (UI old fields, backend ignore karega)
  state?: string | null;
  zip?: string | null;
};

export type Customer = {
  id: number;
  tenantId?: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  idTypeId?: number | null;
  idNumber?: string | null;
  dob?: string | null;          // ISO string
  gender?: string | null;
  nationality?: string | null;
  consent?: boolean;
  addresses?: Address[];
  createdAt?: string;
  updatedAt?: string;
};

// ------------------ HELPERS ------------------
function authHeaders(tenantId?: number) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (tenantId) headers["x-tenant-id"] = tenantId.toString();

  return { headers };
}

function isAxiosLike(
  err: unknown
): err is { response?: { status?: number; data?: any }; message?: string } {
  return typeof err === "object" && err !== null && "message" in err;
}

function handleApiError(error: unknown): never {
  if (isAxiosLike(error)) {
    const status = error.response?.status;
    const data = error.response?.data as any;
    const message =
      (data && (data.message || data.error)) ||
      (typeof error.message === "string" ? error.message : "") ||
      "Something went wrong while communicating with the server.";
    console.error("API Error:", { status, message, data });
    throw new Error(message);
  }
  console.error("Unexpected Error:", error);
  throw new Error("An unexpected error occurred.");
}

// ------------------ CRUD ------------------
export async function getCustomers(tenantId?: number): Promise<Customer[]> {
  try {
    const res = await axios.get<Customer[]>(CUSTOMERS_URL, authHeaders(tenantId));
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

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

export async function createCustomer(
  payload: Partial<Customer>
): Promise<Customer> {
  try {
    const body = {
      tenantId: payload.tenantId,
      name: payload.name,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      idTypeId: payload.idTypeId ?? null,
      idNumber: payload.idNumber ?? null,
      dob: payload.dob ?? null,
      gender: payload.gender ?? null,
      nationality: payload.nationality ?? null,
      consent: payload.consent ?? false,
      addresses: (payload.addresses ?? []).map((a) => ({
        line1: a.line1,
        line2: a.line2 ?? null,
        city: a.city ?? null,
        stateId: a.stateId ?? null,
        districtId: a.districtId ?? null,
        pincode: a.pincode ?? a.zip ?? null,
      })),
    };
    const res = await axios.post<Customer>(
      CUSTOMERS_URL,
      body,
      authHeaders(payload.tenantId)
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateCustomer(
  id: string | number,
  payload: Partial<Customer>
): Promise<Customer> {
  try {
    const body = {
      tenantId: payload.tenantId,
      name: payload.name,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      idTypeId: payload.idTypeId ?? null,
      idNumber: payload.idNumber ?? null,
      dob: payload.dob ?? null,
      gender: payload.gender ?? null,
      nationality: payload.nationality ?? null,
      consent: payload.consent ?? false,
      addresses: (payload.addresses ?? []).map((a) => ({
        line1: a.line1,
        line2: a.line2 ?? null,
        city: a.city ?? null,
        stateId: a.stateId ?? null,
        districtId: a.districtId ?? null,
        pincode: a.pincode ?? a.zip ?? null,
      })),
    };
    const res = await axios.put<Customer>(
      `${CUSTOMERS_URL}/${id}`,
      body,
      authHeaders(payload.tenantId)
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteCustomer(
  id: string | number,
  tenantId?: number
): Promise<{ success: boolean }> {
  try {
    const res = await axios.delete<{ success: boolean }>(
      `${CUSTOMERS_URL}/${id}`,
      authHeaders(tenantId)
    );
    return res.data ?? { success: false };
  } catch (error) {
    handleApiError(error);
  }
}

export async function UpsertCustomer(
  payload: Partial<Customer>
): Promise<Customer> {
  if (payload.id) {
    return updateCustomer(payload.id, payload);
  }
  return createCustomer(payload);
}

// ------------------ METADATA ------------------
export async function getIdTypes() {
  const res = await axios.get(`${CUSTOMERS_URL}/id-types`, authHeaders());
  return res.data as { id: number; name: string }[];
}

export async function getStates() {
  const res = await axios.get(`${CUSTOMERS_URL}/states`, authHeaders());
  return res.data as { id: number; name: string }[];
}

export async function getDistricts(stateId?: number) {
  const url = stateId
    ? `${CUSTOMERS_URL}/districts?stateId=${stateId}`
    : `${CUSTOMERS_URL}/districts`;
  const res = await axios.get(url, authHeaders());
  return res.data as { id: number; name: string; stateId: number }[];
}
