import http from "@/lib/http";

/* ------------------ BASE ------------------ */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1";
const BOOKINGS_URL = `${API_BASE}/bookings`;

/* ------------------ TYPES ------------------ */
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED";

export type Booking = {
  id: number;
  tenantId: number;
  customerId: number;
  sourceId?: number | null;
  checkIn: string;   // ISO
  checkOut: string;  // ISO
  status: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
  customer?: { id: number; name?: string | null; email?: string | null; phone?: string | null };
  rooms?: Array<{ id: number; number: string; type?: { id: number; name: string } | null; rate?: string | null; hotel?: { id: number; name: string } | null }>;
  payments?: Array<{ id: number; amount: string; mode: string; createdAt: string }>;
};

export type CreateBookingInput = {
  customerId: number;
  checkIn: string;   // ISO
  checkOut: string;  // ISO
  sourceId?: number;
  hotelId?: number;
  rooms?: number[];
  guests?: Array<{
    name: string;
    gender?: "M" | "F" | "O";
    idTypeId?: number;
    idNumber?: string;
  }>;
};

export type BookingsListParams = {
  q?: string;
  status?: BookingStatus | "";
  from?: string; // ISO date
  to?: string;   // ISO date
  customerId?: number;
  roomId?: number;
  skip?: number;
  take?: number;
};

export type AvailabilityParams = {
  checkIn: string;  // ISO
  checkOut: string; // ISO
  hotelId?: number;
};

export type AvailabilityResponse = {
  rooms: Array<{ id: number; number: string; type?: { id?: number; name?: string }; rate?: string; hotel?: { id?: number; name?: string } }>;
};

export type MetaResponse = {
  sources: { id: number; name: string }[];
  paymentModes: { id: number; mode: string }[]; // aligns with PaymentMode model
  idTypes?: { id: number; name: string }[];     // for guest ID Type dropdown
};

export type SummaryParams = { from?: string; to?: string };
export type SummaryResponse = {
  pending: number;
  confirmed: number;
  checkedIn: number;
  cancelled: number;
  total: number;
};

/* ------------------ ERROR HANDLING ------------------ */
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
      (typeof (error as any).message === "string" ? (error as any).message : "") ||
      "Something went wrong while communicating with the server.";
    // eslint-disable-next-line no-console
    console.error("API Error:", { status, message, data });
    throw new Error(message);
  }
  // eslint-disable-next-line no-console
  console.error("Unexpected Error:", error);
  throw new Error("An unexpected error occurred.");
}

/* ------------------ CRUD ------------------ */
async function list(params: BookingsListParams = {}): Promise<Booking[]> {
  try {
    const res = await http.get<Booking[]>(BOOKINGS_URL, { params });
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    handleApiError(error);
  }
}

async function get(id: number | string): Promise<Booking | null> {
  try {
    const res = await http.get<Booking>(`${BOOKINGS_URL}/${id}`);
    return res.data ?? null;
  } catch (error) {
    handleApiError(error);
  }
}

async function create(payload: CreateBookingInput): Promise<Booking> {
  try {
    const res = await http.post<Booking>(BOOKINGS_URL, payload);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

async function update(
  id: number | string,
  payload: Partial<CreateBookingInput>
): Promise<Booking> {
  try {
    const res = await http.put<Booking>(`${BOOKINGS_URL}/${id}`, payload);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

async function remove(id: number | string): Promise<{ success: boolean }> {
  try {
    const res = await http.delete<{ success: boolean }>(`${BOOKINGS_URL}/${id}`);
    return res.data ?? { success: false };
  } catch (error) {
    handleApiError(error);
  }
}

/* ------------------ EXTRAS: meta / availability / summary ------------------ */

async function getMeta(): Promise<MetaResponse> {
  try {
    const res = await http.get<MetaResponse>(`${BOOKINGS_URL}/meta`);
    const data = res.data || { sources: [], paymentModes: [], idTypes: [] };
    // normalize shapes
    return {
      sources: Array.isArray(data.sources) ? data.sources : [],
      paymentModes: Array.isArray(data.paymentModes) ? data.paymentModes : [],
      idTypes: Array.isArray(data.idTypes) ? data.idTypes : [],
    };
  } catch (error) {
    handleApiError(error);
  }
}

async function availability(params: AvailabilityParams): Promise<AvailabilityResponse> {
  try {
    const res = await http.get<AvailabilityResponse>(`${BOOKINGS_URL}/availability`, {
      params,
    });
    const rooms = Array.isArray(res.data?.rooms) ? res.data.rooms : [];
    return { rooms };
  } catch (error) {
    handleApiError(error);
  }
}

async function summary(params: SummaryParams = {}): Promise<SummaryResponse> {
  try {
    const res = await http.get<SummaryResponse>(`${BOOKINGS_URL}/summary`, { params });
    const d = res.data || ({} as any);
    return {
      pending: Number(d.pending ?? 0),
      confirmed: Number(d.confirmed ?? 0),
      checkedIn: Number(d.checkedIn ?? 0),
      cancelled: Number(d.cancelled ?? 0),
      total: Number(d.total ?? 0),
    };
  } catch (error) {
    handleApiError(error);
  }
}

/* ------------------ EXPORT ------------------ */
const bookingsService = {
  list,
  get,
  create,
  update,
  remove,
  getMeta,
  availability,
  summary,
};

export default bookingsService;
export type { Booking };
