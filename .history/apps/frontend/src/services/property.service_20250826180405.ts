// Canonical Axios instance (must already handle Authorization + x-tenant-id)
import { api } from "./http";

/* ----------------------------- Types (DTO-aligned) ----------------------------- */
export type HotelDTO = {
  id: number;
  name: string;
  address?: string | null;
  createdAt: string; // ISO
};

export type CreateHotelInput = { name: string; address?: string };
export type UpdateHotelInput = { name?: string; address?: string };

export type RoomStatus = "CLEAN" | "DIRTY" | "INSPECT" | "OOO";

export type RoomDTO = {
  id: number;
  hotelId: number;
  number: string;
  typeId?: number | null;
  status: RoomStatus;
  rate: string; // decimal as string
  createdAt: string;
  updatedAt: string;
  hotel?: { id: number; name: string } | null;
  type?: { id: number; name: string } | null;
};

export type CreateRoomInput = {
  hotelId: number;
  number: string;
  typeId?: number;
  rate: string;            // keep as string to match backend DTO
  status?: RoomStatus;     // defaults to CLEAN if omitted
};

export type UpdateRoomInput = Partial<CreateRoomInput>;

/* ----------------------------- Toast helpers ----------------------------- */
function ok(msg: string) {
  try { (window as any).__toast?.push({ type: "success", message: msg }); } catch {}
}
function fail(e: unknown, fallback = "Something went wrong") {
  const msg =
    (e as any)?.response?.data?.message ||
    (e as any)?.message ||
    fallback;
  try { (window as any).__toast?.push({ type: "error", message: String(msg) }); } catch {}
  throw e; // rethrow so callers can handle if needed
}

/* -------------------------------- Hotels -------------------------------- */
export const propertyHotels = {
  async list(): Promise<HotelDTO[]> {
    try {
      const res = await api.get("/hotels");
      return res.data as HotelDTO[];
    } catch (e) {
      fail(e, "Failed to load hotels");
    }
  },

  async get(id: number): Promise<HotelDTO> {
    try {
      const res = await api.get(`/hotels/${id}`);
      return res.data as HotelDTO;
    } catch (e) {
      fail(e, "Failed to load hotel");
    }
  },

  async create(payload: CreateHotelInput): Promise<HotelDTO> {
    try {
      const res = await api.post("/hotels", payload);
      ok("Hotel created");
      return res.data as HotelDTO;
    } catch (e) {
      fail(e, "Failed to create hotel");
    }
  },

  async update(id: number, payload: UpdateHotelInput): Promise<HotelDTO> {
    try {
      const res = await api.put(`/hotels/${id}`, payload);
      ok("Hotel updated");
      return res.data as HotelDTO;
    } catch (e) {
      fail(e, "Failed to update hotel");
    }
  },

  async remove(id: number): Promise<void> {
    try {
      await api.delete(`/hotels/${id}`);
      ok("Hotel deleted");
    } catch (e) {
      fail(e, "Failed to delete hotel");
    }
  },
};

/* -------------------------------- Rooms --------------------------------- */
export const propertyRooms = {
  async list(hotelId?: number): Promise<RoomDTO[]> {
    try {
      const res = await api.get("/rooms", { params: hotelId ? { hotelId } : {} });
      return res.data as RoomDTO[];
    } catch (e) {
      fail(e, "Failed to load rooms");
    }
  },

  async get(id: number): Promise<RoomDTO> {
    try {
      const res = await api.get(`/rooms/${id}`);
      return res.data as RoomDTO;
    } catch (e) {
      fail(e, "Failed to load room");
    }
  },

  async create(payload: CreateRoomInput): Promise<RoomDTO> {
    try {
      const res = await api.post("/rooms", payload);
      ok("Room created");
      return res.data as RoomDTO;
    } catch (e) {
      fail(e, "Failed to create room");
    }
  },

  async update(id: number, payload: UpdateRoomInput): Promise<RoomDTO> {
    try {
      const res = await api.put(`/rooms/${id}`, payload);
      ok("Room updated");
      return res.data as RoomDTO;
    } catch (e) {
      fail(e, "Failed to update room");
    }
  },

  async updateStatus(id: number, status: RoomStatus): Promise<RoomDTO> {
    try {
      const res = await api.put(`/rooms/${id}/status`, { status });
      ok(`Room marked ${status}`);
      return res.data as RoomDTO;
    } catch (e) {
      fail(e, "Failed to update room status");
    }
  },

  async remove(id: number): Promise<void> {
    try {
      await api.delete(`/rooms/${id}`);
      ok("Room deleted");
    } catch (e) {
      fail(e, "Failed to delete room");
    }
  },
};
