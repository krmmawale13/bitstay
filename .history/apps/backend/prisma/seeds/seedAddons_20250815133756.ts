// prisma/seedAddons.ts
import {
  PrismaClient,
  amenity,
  roomType,
  seasonalrate,
  Booking,
  posOrder,
  license,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting add-on seed...');

  // 1️⃣ Amenities
  const amenitiesData: { name: string; icon: string }[] = [
    { name: 'Free Wi-Fi', icon: 'wifi' },
    { name: 'Air Conditioning', icon: 'ac' },
    { name: 'Swimming Pool', icon: 'pool' },
    { name: 'Room Service', icon: 'room_service' },
  ];

  const amenities: amenity[] = [];
  for (const data of amenitiesData) {
    let amenityItem: amenity | null = await prisma.amenity.findUnique({
      where: { name: data.name },
    });
    if (!amenityItem) {
      amenityItem = await prisma.amenity.create({ data });
    }
    amenities.push(amenityItem);
  }
  console.log(`✅ Seeded ${amenities.length} amenities`);

  // 2️⃣ Room Amenities
  const roomTypes: roomType[] = await prisma.roomType.findMany();
  for (const rt of roomTypes) {
    for (const am of amenities) {
      const existingLink = await prisma.roomamenity.findUnique({
        where: {
          roomTypeId_amenityId: {
            roomTypeId: rt.id,
            amenityId: am.id,
          },
        },
      });
      if (!existingLink) {
        await prisma.roomamenity.create({
          data: {
            roomTypeId: rt.id,
            amenityId: am.id,
          },
        });
      }
    }
  }
  console.log(`✅ Linked amenities to ${roomTypes.length} room types`);

  // 3️⃣ Seasonal Rates
  const seasonalRatesData = [
    { startDate: new Date('2025-12-15'), endDate: new Date('2026-01-10'), rate: 5000.0 },
    { startDate: new Date('2025-06-01'), endDate: new Date('2025-06-30'), rate: 4000.0 },
  ];
  for (const rt of roomTypes) {
    for (const sr of seasonalRatesData) {
      const existingRate = await prisma.seasonalrate.findUnique({
        where: {
          roomTypeId_startDate_endDate: {
            roomTypeId: rt.id,
            startDate: sr.startDate,
            endDate: sr.endDate,
          },
        },
      });
      if (!existingRate) {
        await prisma.seasonalrate.create({
          data: {
            roomTypeId: rt.id,
            startDate: sr.startDate,
            endDate: sr.endDate,
            rate: sr.rate,
          },
        });
      }
    }
  }
  console.log(`✅ Seasonal rates checked/seeded`);

  // 4️⃣ Booking Charges
  const bookings: booking[] = await prisma.booking.findMany();
  for (const b of bookings) {
    const existingCharge = await prisma.bookingcharge.findUnique({
      where: {
        bookingId_description: {
          bookingId: b.id,
          description: 'Service Charge',
        },
      },
    });
    if (!existingCharge) {
      await prisma.bookingcharge.create({
        data: {
          bookingId: b.id,
          description: 'Service Charge',
          amount: 500.0,
          taxAmount: 90.0,
        },
      });
    }
  }
  console.log(`✅ Booking charges checked/seeded`);

  // 5️⃣ POS Order Add-ons
  const posOrders: posOrder[] = await prisma.posOrder.findMany();
  for (const order of posOrders) {
    const existingAddon = await prisma.posorderaddon.findUnique({
      where: { posOrderId: order.id },
    });
    if (!existingAddon) {
      await prisma.posorderaddon.create({
        data: {
          posOrderId: order.id,
          serviceChargePct: 5.0,
          orderType: 'DINE_IN',
        },
      });
    }
  }
  console.log(`✅ POS order add-ons checked/seeded`);

  // 6️⃣ Licenses + Alerts
  const licenseNames = ['Liquor License', 'Fire Safety Certificate', 'Food Safety License'];
  for (const name of licenseNames) {
    let licenseItem: license | null = await prisma.license.findUnique({ where: { name } });
    if (!licenseItem) {
      licenseItem = await prisma.license.create({
        data: { name, expiryDate: new Date('2026-12-31') },
      });
    }

    const existingAlert = await prisma.licenserenewalalert.findUnique({
      where: {
        licenseId_renewalAlertDays: {
          licenseId: licenseItem.id,
          renewalAlertDays: 30,
        },
      },
    });
    if (!existingAlert) {
      await prisma.licenserenewalalert.create({
        data: { licenseId: licenseItem.id, renewalAlertDays: 30 },
      });
    }
  }
  console.log(`✅ Licenses and alerts checked/seeded`);
}

main()
  .then(async () => {
    console.log('🌱 Add-on seed completed without duplicates.');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
