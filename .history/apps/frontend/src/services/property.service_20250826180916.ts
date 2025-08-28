import http from "@/lib/http";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1";

/* -------------------- Types (FE-side) -------------------- */
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
  rate: string;           // keep as string to match backend DTO
  status?: RoomStatus;    // defaults to CLEAN if omitted
};

export type UpdateRoomInput = Partial<CreateRoomInput>;

/* -------------------- Helpers -------------------- */
function unwrap<T>(p: Promise<{ data: T }>) {
  return p.then((r) => r.data);
}

/* -------------------- Hotels API -------------------- */
const HOTELS_URL = `${API_BASE}/hotels`;

async function listHotels() {
  return unwrap<HotelDTO[]>(http.get(HOTELS_URL));
}

async function getHotel(id: number) {
  return unwrap<HotelDTO>(http.get(`${HOTELS_URL}/${id}`));
}

async function createHotel(payload: CreateHotelInput) {
  return unwrap<HotelDTO>(http.post(HOTELS_URL, payload));
}

async function updateHotel(id: number, payload: UpdateHotelInput) {
  return unwrap<HotelDTO>(http.put(`${HOTELS_URL}/${id}`, payload));
}

async function deleteHotel(id: number) {
  return unwrap<void>(http.delete(`${HOTELS_URL}/${id}`));
}

/* -------------------- Rooms API -------------------- */
const ROOMS_URL = `${API_BASE}/rooms`;

// optional filter by hotelId (matches backend ?hotelId=)
async function listRooms(hotelId?: number) {
  return unwrap<RoomDTO[]>(
    http.get(ROOMS_URL, { params: hotelId ? { hotelId } : {} })
  );
}

async function getRoom(id: number) {
  return unwrap<RoomDTO>(http.get(`${ROOMS_URL}/${id}`));
}

async function createRoom(payload: CreateRoomInput) {
  return unwrap<RoomDTO>(http.post(ROOMS_URL, payload));
}

async function updateRoom(id: number, payload: UpdateRoomInput) {
  return unwrap<RoomDTO>(http.put(`${ROOMS_URL}/${id}`, payload));
}

async function updateRoomStatus(id: number, status: RoomStatus) {
  return unwrap<RoomDTO>(http.put(`${ROOMS_URL}/${id}/status`, { status }));
}

async function deleteRoom(id: number) {
  return unwrap<void>(http.delete(`${ROOMS_URL}/${id}`));
}

/* -------------------- Export shape (sync with your style) -------------------- */
export const hotelsService = {
  list: listHotels,
  get: getHotel,
  create: createHotel,
  update: updateHotel,
  remove: deleteHotel,
};

export const roomsService = {
  list: listRooms,
  get: getRoom,
  create: createRoom,
  update: updateRoom,
  updateStatus: updateRoomStatus,
  remove: deleteRoom,
};

// Optional default export, mirroring your bookingsService default style
const propertyService = {
  hotels: hotelsService,
  rooms: roomsService,
};
export default propertyService;
