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

export type RoomImageDTO = {
  id: number;
  url: string;
  createdAt: string; // ISO
};

export type AmenityDTO = {
  id: number;
  name: string;
  icon?: string | null;
};

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
  images?: RoomImageDTO[];          // present in GET /rooms/:id
  amenities?: AmenityDTO[];         // derived on the backend from RoomType -> roomamenity
};

export type CreateRoomInput = {
  hotelId: number;
  number: string;
  typeId?: number;
  rate: string;           // keep as string to match backend DTO
  status?: RoomStatus;    // backend defaults allowed
};

export type UpdateRoomInput = Partial<CreateRoomInput>;

export type RoomsMeta = {
  hotels: { id: number; name: string }[];
  roomTypes: { id: number; name: string }[];
  statuses: RoomStatus[];
  amenities: AmenityDTO[]; // 👈 needed for the Manage amenities modal
};

/* -------- Hotels summary (matches backend /hotels/summary) -------- */
export type HotelsSummary = {
  totals: {
    hotels: number;
    rooms: number;
    activeHotels: number;
    avgRoomsPerHotel: number; // e.g. 12.5
  };
  roomsByStatus: {
    CLEAN: number;
    DIRTY: number;
    INSPECT: number;
    OOO: number;
  };
  occupancy: {
    occupiedRooms: number;
    totalRooms: number;
    percent: number; // 0..100 (1 decimal precision)
  };
  perHotel: Array<{ id: number; name: string; address: string | null; rooms: number }>;
  generatedAt: string; // ISO
};

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

/* Backend-computed summary */
async function summaryHotels() {
  return unwrap<HotelsSummary>(http.get(`${HOTELS_URL}/summary`));
}

/* -------------------- Rooms API -------------------- */
const ROOMS_URL = `${API_BASE}/rooms`;

/** GET /rooms/meta */
async function roomsMeta() {
  return unwrap<RoomsMeta>(http.get(`${ROOMS_URL}/meta`));
}

/** GET /rooms?hotelId= */
async function listRooms(hotelId?: number) {
  return unwrap<RoomDTO[]>(
    http.get(ROOMS_URL, { params: hotelId ? { hotelId } : {} })
  );
}

/** GET /rooms/:id (includes images[] and derived amenities[]) */
async function getRoom(id: number) {
  return unwrap<RoomDTO>(http.get(`${ROOMS_URL}/${id}`));
}

/** POST /rooms (no images here; images are added via /rooms/:id/images) */
async function createRoom(payload: CreateRoomInput) {
  return unwrap<RoomDTO>(http.post(ROOMS_URL, payload));
}

/** PUT /rooms/:id */
async function updateRoom(id: number, payload: UpdateRoomInput) {
  return unwrap<RoomDTO>(http.put(`${ROOMS_URL}/${id}`, payload));
}

/** PUT /rooms/:id/status */
async function updateRoomStatus(id: number, status: RoomStatus) {
  return unwrap<RoomDTO>(http.put(`${ROOMS_URL}/${id}/status`, { status }));
}

/** DELETE /rooms/:id */
async function deleteRoom(id: number) {
  return unwrap<void>(http.delete(`${ROOMS_URL}/${id}`));
}

/* ---- Room Images (matches backend) ---- */

/** POST /rooms/:id/images  body: { urls: string[] }  -> returns RoomDTO */
async function addRoomImages(id: number, urls: string[]) {
  return unwrap<RoomDTO>(http.post(`${ROOMS_URL}/${id}/images`, { urls }));
}

/** DELETE /rooms/:id/images/:imageId -> returns RoomDTO */
async function removeRoomImage(id: number, imageId: number) {
  return unwrap<RoomDTO>(http.delete(`${ROOMS_URL}/${id}/images/${imageId}`));
}

/** PUT /rooms/:id/images/reorder body: { ids: number[] } -> returns RoomDTO */
//    ^^^^^ ensure this matches the backend controller path
async function reorderRoomImages(id: number, ids: number[]) {
  return unwrap<RoomDTO>(http.put(`${ROOMS_URL}/${id}/images/order`, { ids }));
}

/* ---- RoomType ↔ Amenities (served by RoomsController) ---- */
async function getRoomTypeAmenities(typeId: number) {
  return unwrap<{ amenityIds: number[]; amenities: AmenityDTO[] }>(
    http.get(`${ROOMS_URL}/types/${typeId}/amenities`)
  );
}

async function setRoomTypeAmenities(typeId: number, amenityIds: number[]) {
  return unwrap<{ amenityIds: number[]; amenities: AmenityDTO[] }>(
    http.put(`${ROOMS_URL}/types/${typeId}/amenities`, { amenityIds })
  );
}

/* -------------------- Export shape -------------------- */
export const hotelsService = {
  list: listHotels,
  get: getHotel,
  create: createHotel,
  update: updateHotel,
  remove: deleteHotel,
  summary: summaryHotels,
};

export const roomsService = {
  meta: roomsMeta,
  list: listRooms,
  get: getRoom,
  create: createRoom,
  update: updateRoom,
  updateStatus: updateRoomStatus,
  remove: deleteRoom,
  addImages: addRoomImages,
  removeImage: removeRoomImage,
  reorderImages: reorderRoomImages,
  getTypeAmenities: getRoomTypeAmenities,   // 👈 NEW
  setTypeAmenities: setRoomTypeAmenities,   // 👈 NEW
};

/* Optional default export */
const propertyService = {
  hotels: hotelsService,
  rooms: roomsService,
};
export default propertyService;
