/* -----------------------------------------------------------
 * Summary for Hotels dashboard (FE consumes directly)
 * - No FE calculations required
 * - Uses Rooms + Bookings to compute occupancy
 * ----------------------------------------------------------- */
async getSummary(tenantId: number) {
  // Parallel fetches for speed
  const [
    totalHotels,
    totalRooms,
    cleanCount,
    dirtyCount,
    inspectCount,
    oooCount,
    perHotelRooms,                // includes address now
    activeBookedRoomIdsDistinct,
  ] = await Promise.all([
    this.prisma.hotel.count({ where: { tenantId } }),
    this.prisma.room.count({ where: { tenantId } }),

    // Room status buckets
    this.prisma.room.count({ where: { tenantId, status: 'CLEAN' } }),
    this.prisma.room.count({ where: { tenantId, status: 'DIRTY' } }),
    this.prisma.room.count({ where: { tenantId, status: 'INSPECT' } }),
    this.prisma.room.count({ where: { tenantId, status: 'OOO' } }),

    // Per-hotel room counts (include address for FE table)
    this.prisma.hotel.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        address: true,            // 👈 add this
        _count: { select: { rooms: true } },
      },
      orderBy: { name: 'asc' },
    }),

    // Distinct occupied roomIds
    this.prisma.bookingRoom.findMany({
      where: {
        booking: {
          tenantId,
          status: { in: ['CONFIRMED', 'CHECKED_IN'] as any[] },
        },
      },
      distinct: ['roomId'],
      select: { roomId: true },
    }),
  ]);

  const activeHotels = perHotelRooms.filter(h => h._count.rooms > 0).length;
  const avgRoomsPerHotel = totalHotels > 0 ? Number((totalRooms / totalHotels).toFixed(2)) : 0;
  const occupiedRooms = activeBookedRoomIdsDistinct.length;
  const occupancyPct = totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(1)) : 0;

  return {
    totals: {
      hotels: totalHotels,
      rooms: totalRooms,
      activeHotels,
      avgRoomsPerHotel,
    },
    roomsByStatus: {
      CLEAN: cleanCount,
      DIRTY: dirtyCount,
      INSPECT: inspectCount,
      OOO: oooCount,
    },
    occupancy: {
      occupiedRooms,
      totalRooms,
      percent: occupancyPct, // 0–100
    },
    perHotel: perHotelRooms.map(h => ({
      id: h.id,
      name: h.name,
      address: h.address ?? null, // 👈 include in response
      rooms: h._count.rooms,
    })),
    generatedAt: new Date().toISOString(),
  };
}
