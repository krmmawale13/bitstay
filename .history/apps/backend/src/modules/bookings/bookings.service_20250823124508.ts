// apps/frontend/src/services/bookings.service.ts
import http from "@/lib/http";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1";
const ROOT = `${API_BASE}/bookings`;

/* ------------------ Types ------------------ */
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED";

export type ListParams = {
  from?: string;
  to?: string;
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
};

export type CreateBookingPayload = {
  customerId: number;
  checkIn: string;   // ISO
  checkOut: string;  // ISO
  sourceId?: number;
  hotelId?: number;  // FE only (used to filter availability), not sent in create
  rooms?: number[];
  guests?: BookingGuestInput[];
};

export type UpdateBookingPayload = Partial<
  Pick<CreateBookingPayload, "checkIn" | "checkOut" | "sourceId">
>;

export type BookingListItem = {
  id: number;
  tenantId: number;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  customer?: { id: number; name: string | null } | null;
  source?: { id: number; name: string } | null;
  rooms: {
    id: number;
    room: {
      id: number;
      number: string;
      rate: string;
      hotel?: { id: number; name: string } | null;
      type?: { id: number; name: string } | null;
    };
  }[];
};

export type BookingDetail = BookingListItem & {
  guests: {
    id: number;
    name: string;
    idTypeId?: number | null;
    idNumber?: string | null;
    idType?: { id: number; name: string } | null;
  }[];
  payments: {
    id: number;
    amount: string;
    createdAt: string;
    mode?: { id: number; mode: string } | null;
  }[];
  bookingcharge: {
    id: number;
    description: string;
    amount: string;
    taxAmount: string;
  }[];
  roomAllocationHistory: {
    id: number;
    oldRoomId: number | null;
    newRoomId: number | null;
    changedAt: string;
  }[];
};

export type MetaResponse = {
  idTypes: { id: number; name: string }[];
  sources: { id: number; name: string }[];
  paymentModes: { id: number; mode: string }[];
};

export type AvailabilityResponse = {
  rooms: {
    id: number;
    number: string;
    rate: string;
    hotel?: { id: number; name: string } | null;
    type?: { id: number; name: string } | null;
  }[];
};

export type SummaryResponse = {
  total: number;
  PENDING: number;
  CONFIRMED: number;
  CHECKED_IN: number;
  CHECKED_OUT: number;
  CANCELLED: number;
};

/* ------------------ API ------------------ */
export const bookingsService = {
  async list(params: ListParams) {
    const res = await http.get(`${ROOT}`, { params });
    return res.data as { items: BookingListItem[]; total: number; skip: number; take: number };
  },

  async get(id: number) {
    const res = await http.get(`${ROOT}/${id}`);
    return res.data as BookingDetail;
  },

  async create(payload: CreateBookingPayload) {
    const body = {
      customerId: payload.customerId,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      sourceId: payload.sourceId ?? undefined,
      rooms: payload.rooms?.length ? payload.rooms : undefined,
      guests: payload.guests?.length ? payload.guests : undefined,
    };
    const res = await http.post(`${ROOT}`, body);
    return res.data as BookingDetail;
  },

  async update(id: number, payload: UpdateBookingPayload) {
    const res = await http.put(`${ROOT}/${id}`, payload);
    return res.data as BookingDetail;
  },

  async allocateRoom(id: number, dto: { newRoomId: number; note?: string }) {
    // note is FE-only for UI; BE doesn’t store note in history table
    const res = await http.post(`${ROOT}/${id}/allocate-room`, { newRoomId: dto.newRoomId });
    return res.data as { ok: true };
  },

  async addGuests(id: number, guests: BookingGuestInput[]) {
    const res = await http.post(`${ROOT}/${id}/guests`, { guests });
    return res.data as { ok: true };
  },

  async addCharge(id: number, charge: { description: string; amount: number; taxAmount?: number }) {
    const res = await http.post(`${ROOT}/${id}/charges`, charge);
    return res.data as { ok: true };
  },

  async addPayment(id: number, payment: { amount: number; modeId?: number }) {
    const res = await http.post(`${ROOT}/${id}/payments`, payment);
    return res.data as { ok: true };
  },

  async checkIn(id: number) {
    const res = await http.post(`${ROOT}/${id}/check-in`, {});
    return res.data as BookingDetail;
  },

  async checkOut(id: number) {
    const res = await http.post(`${ROOT}/${id}/check-out`, {});
    return res.data as BookingDetail;
  },

  async cancel(id: number) {
    const res = await http.post(`${ROOT}/${id}/cancel`, {});
    return res.data as BookingDetail;
  },

  // ---- meta & utils ----
  async getMeta() {
    const res = await http.get(`${ROOT}/meta`);
    return res.data as MetaResponse;
  },

  async availability(params: { checkIn: string; checkOut: string; hotelId?: number }) {
    const res = await http.get(`${ROOT}/availability`, { params });
    return res.data as AvailabilityResponse;
  },

  async summary(params?: { from?: string; to?: string }) {
    const res = await http.get(`${ROOT}/summary`, { params });
    return res.data as SummaryResponse;
  },
};
