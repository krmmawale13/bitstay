// prisma/seedAddons.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting add-on seed...');

  // 1️⃣ Amenities
  const amenitiesData = [
    { name: 'Free Wi-Fi', icon: 'wifi' },
    { name: 'Air Conditioning', icon: 'ac' },
    { name: 'Swimming Pool', icon: 'pool' },
    { name: 'Room Service', icon: 'room_service' },
  ];

  const amenities = [];
  for (const data of amenitiesData) {
    let amenity = await prisma.amenity.findUnique({ where: { name: data.name } });
    if (!amenity) {
      amenity = await prisma.amenity.create({ data });
    }
    amenities.push(amenity);
  }
  console.log(`✅ Seeded ${amenities.length} amenities`);

  // 2️⃣ Room Amenities — link only if missing
  const roomTypes = await prisma.roomtype.findMany();
  for (const roomType of roomTypes) {
    for (const amenity of amenities) {
      const existingLink = await prisma.roomamenity.findUnique({
        where: {
          roomTypeId_amenityId: {
            roomTypeId: roomType.id,
            amenityId: amenity.id,
          },
        },
      });
      if (!existingLink) {
        await prisma.roomamenity.create({
          data: {
            roomTypeId: roomType.id,
            amenityId: amenity.id,
          },
        });
      }
    }
  }
  console.log(`✅ Linked amenities to ${roomTypes.length} room types`);

  // 3️⃣ Seasonal Rates — add only if missing
  const seasonalRatesData = [
    { startDate: new Date('2025-12-15'), endDate: new Date('2026-01-10'), rate: 5000.0 },
    { startDate: new Date('2025-06-01'), endDate: new Date('2025-06-30'), rate: 4000.0 },
  ];
  for (const roomType of roomTypes) {
    for (const sr of seasonalRatesData) {
      const existingRate = await prisma.seasonalrate.findUnique({
        where: {
          roomTypeId_startDate_endDate: {
            roomTypeId: roomType.id,
            startDate: sr.startDate,
            endDate: sr.endDate,
          },
        },
      });
      if (!existingRate) {
        await prisma.seasonalrate.create({
          data: {
            roomTypeId: roomType.id,
            startDate: sr.startDate,
            endDate: sr.endDate,
            rate: sr.rate,
          },
        });
      }
    }
  }
  console.log(`✅ Seasonal rates checked/seeded`);

  // 4️⃣ Booking Charges — only if missing
  const bookings = await prisma.booking.findMany();
  for (const booking of bookings) {
    const existingCharge = await prisma.bookingcharge.findUnique({
      where: {
        bookingId_description: {
          bookingId: booking.id,
          description: 'Service Charge',
        },
      },
    });
    if (!existingCharge) {
      await prisma.bookingcharge.create({
        data: {
          bookingId: booking.id,
          description: 'Service Charge',
          amount: 500.0,
          taxAmount: 90.0,
        },
      });
    }
  }
  console.log(`✅ Booking charges checked/seeded`);

  // 5️⃣ POS Order Add-ons — only if missing
  const posOrders = await prisma.posorder.findMany();
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

  // 6️⃣ Licenses + Alerts — only if missing
  const licenseNames = ['Liquor License', 'Fire Safety Certificate', 'Food Safety License'];
  for (const name of licenseNames) {
    let license = await prisma.license.findUnique({ where: { name } });
    if (!license) {
      license = await prisma.license.create({
        data: { name, expiryDate: new Date('2026-12-31') },
      });
    }

    const existingAlert = await prisma.licenserenewalalert.findUnique({
      where: {
        licenseId_renewalAlertDays: {
          licenseId: license.id,
          renewalAlertDays: 30,
        },
      },
    });
    if (!existingAlert) {
      await prisma.licenserenewalalert.create({
        data: { licenseId: license.id, renewalAlertDays: 30 },
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
