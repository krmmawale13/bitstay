import { api } from "./http"; // 👈 this is our canonical axios instance with token + x-tenant-id

// ----------------------------- HOTELS -----------------------------
export const propertyHotels = {
  async list() {
    const res = await api.get("/hotels");
    return res.data;
  },
  async get(id: number) {
    const res = await api.get(`/hotels/${id}`);
    return res.data;
  },
  async create(payload: { name: string; address?: string }) {
    const res = await api.post("/hotels", payload);
    window.__toast?.push({ type: "success", message: "Hotel created" });
    return res.data;
  },
  async update(id: number, payload: { name?: string; address?: string }) {
    const res = await api.put(`/hotels/${id}`, payload);
    window.__toast?.push({ type: "success", message: "Hotel updated" });
    return res.data;
  },
  async remove(id: number) {
    await api.delete(`/hotels/${id}`);
    window.__toast?.push({ type: "success", message: "Hotel deleted" });
  },
};

// ----------------------------- ROOMS -----------------------------
export const propertyRooms = {
  async list(hotelId?: number) {
    const res = await api.get("/rooms", { params: hotelId ? { hotelId } : {} });
    return res.data;
  },
  async get(id: number) {
    const res = await api.get(`/rooms/${id}`);
    return res.data;
  },
  async create(payload: {
    hotelId: number;
    number: string;
    typeId?: number;
    rate: string;
    status?: "CLEAN" | "DIRTY" | "INSPECT" | "OOO";
  }) {
    const res = await api.post("/rooms", payload);
    window.__toast?.push({ type: "success", message: "Room created" });
    return res.data;
  },
  async update(
    id: number,
    payload: {
      hotelId?: number;
      number?: string;
      typeId?: number;
      rate?: string;
      status?: "CLEAN" | "DIRTY" | "INSPECT" | "OOO";
    }
  ) {
    const res = await api.put(`/rooms/${id}`, payload);
    window.__toast?.push({ type: "success", message: "Room updated" });
    return res.data;
  },
  async updateStatus(id: number, status: "CLEAN" | "DIRTY" | "INSPECT" | "OOO") {
    const res = await api.put(`/rooms/${id}/status`, { status });
    window.__toast?.push({ type: "success", message: `Room marked ${status}` });
    return res.data;
  },
  async remove(id: number) {
    await api.delete(`/rooms/${id}`);
    window.__toast?.push({ type: "success", message: "Room deleted" });
  },
};
