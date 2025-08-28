import http from "@/lib/http";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1";
const BASE_URL = `${API_BASE}/bookings`;

/* -------------------- Types (FE-side) -------------------- */
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED";

export type ListParams = {
  from?: string; // ISO date string
  to?: string; // ISO date string
  status?: BookingStatus;
  customerId?: number;
  roomId?: number;
  sourceId?: number;
  skip?: number;
  take?: number;
};

export type BookingGuestInput = {
  name: string;
  idTypeId?: number | null;
  idNumber?: string | null;
  // gender intentionally omitted (not in schema)
};

export type CreateBookingInput = {
  customerId: number;
  checkIn: string; // ISO
  checkOut: string; // ISO
  sourceId?: number;
  hotelId?: number; // (UI filter only; backend alloc uses rooms[])
  rooms?: number[];
  guests?: BookingGuestInput[];
};

export type UpdateBookingInput = Partial<CreateBookingInput>;

export type AddChargeInput = {
  description: string;
  amount: number | string; // we coerce to number
  taxAmount?: number | string;
};

export type AddPaymentInput = {
  amount: number | string; // we coerce to number
  modeId?: number;
};

/* -------------------- Helpers -------------------- */
function toQuery(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function unwrap<T>(p: Promise<{ data: T }>) {
  return p.then((r) => r.data);
}

/** Coerce UI amount (may be string like "2000" or "₹2,000") to number */
function coerceAmount(v: number | string | undefined | null): number {
  if (v === undefined || v === null) return NaN;
  if (typeof v === "number") return v;
  // strip currency symbol and commas/spaces
  const cleaned = v.replace(/[₹,\s]/g, "");
  const n = Number(cleaned);
  return n;
}

/* -------------------- API -------------------- */
async function list(params: ListParams) {
  const qs = toQuery(params || {});
  return unwrap<{ items: any[]; total: number; skip: number; take: number }>(
    http.get(`${BASE_URL}${qs}`),
  );
}

async function get(id: number) {
  return unwrap<any>(http.get(`${BASE_URL}/${id}`));
}

async function create(payload: CreateBookingInput) {
  return unwrap<any>(http.post(BASE_URL, payload));
}

async function update(id: number, payload: UpdateBookingInput) {
  return unwrap<any>(http.put(`${BASE_URL}/${id}`, payload));
}

/* -------- allocateRoom: accepts number OR object { newRoomId, note? } -------- */
export type AllocateRoomArg = number | { newRoomId: number; note?: string };

function normalizeAllocateRoomArg(arg: AllocateRoomArg) {
  if (typeof arg === "number") return { newRoomId: arg };
  return { newRoomId: arg?.newRoomId };
}

async function allocateRoom(id: number, arg: AllocateRoomArg) {
  const body = normalizeAllocateRoomArg(arg);
  return unwrap<{ ok: true }>(http.post(`${BASE_URL}/${id}/allocate-room`, body));
}

/* -------- addGuests: accepts array OR object { guests: [...] } -------- */
export type AddGuestsArg = BookingGuestInput[] | { guests: BookingGuestInput[] };

function normalizeAddGuestsArg(arg: AddGuestsArg) {
  if (Array.isArray(arg)) return { guests: arg };
  return { guests: Array.isArray(arg?.guests) ? arg.guests : [] };
}

async function addGuests(id: number, arg: AddGuestsArg) {
  const body = normalizeAddGuestsArg(arg);
  return unwrap<{ ok: true }>(http.post(`${BASE_URL}/${id}/guests`, body));
}

/** Remove a single guest from a booking */
export async function removeGuest(
  bookingId: number,
  guestId: number,
): Promise<{ ok: boolean }> {
  return unwrap<{ ok: boolean }>(
    http.delete(`${BASE_URL}/${bookingId}/guests/${guestId}`),
  );
}

async function addCharge(id: number, payload: AddChargeInput) {
  const amount = coerceAmount(payload.amount);
  const taxAmount =
    payload.taxAmount === undefined ? undefined : coerceAmount(payload.taxAmount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Please enter a valid amount (>= 0).");
  }
  if (taxAmount !== undefined && (!Number.isFinite(taxAmount) || taxAmount < 0)) {
    throw new Error("Please enter a valid tax amount (>= 0).");
  }
  return unwrap<{ ok: true }>(
    http.post(`${BASE_URL}/${id}/charges`, {
      description: payload.description,
      amount,
      taxAmount,
    }),
  );
}

async function addPayment(id: number, payload: AddPaymentInput) {
  const amount = coerceAmount(payload.amount);
  if (!Number.isFinite(amount) || amount < 0.01) {
    throw new Error("Please enter a valid amount (>= 0.01).");
  }
  return unwrap<{ ok: true }>(
    http.post(`${BASE_URL}/${id}/payments`, {
      amount,
      modeId: payload.modeId ?? null,
    }),
  );
}

async function checkIn(id: number) {
  return unwrap<any>(http.post(`${BASE_URL}/${id}/check-in`, {}));
}
async function checkOut(id: number) {
  return unwrap<any>(http.post(`${BASE_URL}/${id}/check-out`, {}));
}
async function cancel(id: number) {
  return unwrap<any>(http.post(`${BASE_URL}/${id}/cancel`, {}));
}

/** Confirm a booking (PENDING -> CONFIRMED) */
export async function confirmBooking(id: number): Promise<any> {
  return unwrap<any>(http.post(`${BASE_URL}/${id}/confirm`, {}));
}

/* ---- meta & availability & summary ---- */
async function getMeta() {
  // backend returns: { sources, paymentModes, idTypes }
  return unwrap<{
    sources: { id: number; name: string }[];
    paymentModes: { id: number; mode: string }[];
    idTypes?: { id: number; name: string }[];
  }>(http.get(`${BASE_URL}/meta`));
}

async function availability(args: { checkIn: string; checkOut: string; hotelId?: number }) {
  const qs = toQuery(args);
  // backend returns: { rooms: [{ id, number, rate, type:{id,name}, hotel:{id,name} }] }
  return unwrap<{ rooms: any[] }>(http.get(`${BASE_URL}/availability${qs}`));
}

async function summary(range?: { from?: string; to?: string }) {
  const qs = toQuery(range || {});
  // expected: { total, PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED }
  return unwrap<{
    total: number;
    PENDING: number;
    CONFIRMED: number;
    CHECKED_IN: number;
    CHECKED_OUT: number;
    CANCELLED: number;
  }>(http.get(`${BASE_URL}/summary${qs}`));
}

/* -------------------- export default -------------------- */
const bookingsService = {
  list,
  get,
  create,
  update,
  allocateRoom,
  addGuests,
  removeGuest, // NEW
  addCharge,
  addPayment,
  checkIn,
  checkOut,
  cancel,
  confirm: confirmBooking, // NEW (alias)
  confirmBooking, // NEW
  getMeta,
  availability,
  summary,
};

export default bookingsService;
