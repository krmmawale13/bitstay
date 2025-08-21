import axios from "axios";

axios.defaults.withCredentials = true;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1";
const CUSTOMERS_URL = `${API_BASE}/customers`;

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

function authHeaders(tenantId?: number) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (tenantId) headers["x-tenant-id"] = tenantId.toString();

  return { headers };
}

// ------------------ ERROR HANDLER ------------------
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong while communicating with the server.";

    console.error(
      "API Error:",
      { status, message, data: error.response?.data },
      error
    );

    throw {
      success: false,
      status,
      message,
      details: error.response?.data || null,
    };
  }

  console.error("Unexpected Error:", error);
  throw {
    success: false,
    status: 500,
    message: "An unexpected error occurred.",
    details: error,
  };
}

// ------------------ LIST ------------------
export async function getCustomers(
  tenantId?: number
): Promise<Customer[] | []> {
  try {
    const res = await axios.get<Customer[]>(
      CUSTOMERS_URL,
      authHeaders(tenantId)
    );
    return res.data ?? [];
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
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ------------------ UPDATE ------------------
export async function updateCustomer(
  id: string | number,
  payload: Partial<Customer>
): Promise<Customer> {
  try {
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
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ------------------ DELETE ------------------
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

// ------------------ UPSERT ------------------
export async function UpsertCustomer(
  payload: Partial<Customer>
): Promise<Customer> {
  if (payload.id) {
    return updateCustomer(payload.id, payload);
  }
  return createCustomer(payload);
}
