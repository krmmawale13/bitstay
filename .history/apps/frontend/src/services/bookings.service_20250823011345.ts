// apps/frontend/src/services/bookings.service.ts
import http from './http';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED';

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

export type CreateBookingPayload = {
  customerId: number;
  checkIn: string;   // ISO
  checkOut: string;  // ISO
  sourceId?: number;
  rooms?: number[];  // Room IDs
  guests?: { name: string; idTypeId?: number; idNumber?: string }[];
};

export type UpdateBookingPayload = {
  checkIn?: string;
  checkOut?: string;
  sourceId?: number;
};

export type AllocateRoomPayload = {
  newRoomId: number;
  note?: string;
};

export type AddGuestsPayload = {
  guests: { name: string; idTypeId?: number; idNumber?: string }[];
};

export type AddChargePayload = {
  description: string;
  amount: number;
  taxAmount?: number;
};

export type AddPaymentPayload = {
  amount: number;
  modeId?: number;
};

const BASE = '/bookings';

const buildQuery = (params: Record<string, any>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

export const bookingsService = {
  // -------- Queries --------
  async list(params: ListParams) {
    const qs = buildQuery(params);
    const url = qs ? `${BASE}?${qs}` : BASE;
    const { data } = await http.get(url);
    return data as {
      items: any[];
      total: number;
      skip: number;
      take: number;
    };
  },

  async get(id: number) {
    const { data } = await http.get(`${BASE}/${id}`);
    return data as any;
  },

  async getMeta() {
    const { data } = await http.get(`${BASE}/meta`);
    return data as {
      sources: { id: number; name: string }[];
      paymentModes: { id: number; mode: string }[];
    };
  },

  async availability(params: { checkIn: string; checkOut: string; hotelId?: number }) {
    const qs = buildQuery(params);
    const { data } = await http.get(`${BASE}/availability?${qs}`);
    return data as { rooms: any[] };
  },

  // -------- Mutations --------
  async create(payload: CreateBookingPayload) {
    const { data } = await http.post(BASE, payload);
    return data as any;
  },

  async update(id: number, payload: UpdateBookingPayload) {
    const { data } = await http.put(`${BASE}/${id}`, payload);
    return data as any;
  },

  async allocateRoom(id: number, payload: AllocateRoomPayload) {
    const { data } = await http.post(`${BASE}/${id}/allocate-room`, payload);
    return data as any;
  },

  async addGuests(id: number, payload: AddGuestsPayload) {
    const { data } = await http.post(`${BASE}/${id}/guests`, payload);
    return data as any;
  },

  async addCharge(id: number, payload: AddChargePayload) {
    const { data } = await http.post(`${BASE}/${id}/charges`, payload);
    return data as any;
  },

  async addPayment(id: number, payload: AddPaymentPayload) {
    const { data } = await http.post(`${BASE}/${id}/payments`, payload);
    return data as any;
  },

  async checkIn(id: number) {
    const { data } = await http.post(`${BASE}/${id}/check-in`, {});
    return data as any;
  },

  async checkOut(id: number) {
    const { data } = await http.post(`${BASE}/${id}/check-out`, {});
    return data as any;
  },

  async cancel(id: number) {
    const { data } = await http.post(`${BASE}/${id}/cancel`, {});
    return data as any;
  },
};

export default bookingsService;
