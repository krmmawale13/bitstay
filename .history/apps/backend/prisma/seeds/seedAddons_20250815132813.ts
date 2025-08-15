// prisma/seedAddons.ts
import { PrismaClient, roomamenity, RoomType } from '@prisma/client';

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

  const amenities: Amenity[] = []; // ✅ explicitly typed
  for (const data of amenitiesData) {
    const amenity: Amenity = await prisma.amenity.upsert({
      where: { name: data.name },
      update: data,
      create: data,
    });
    amenities.push(amenity);
  }
  console.log(`✅ Seeded ${amenities.length} amenities`);

  // 2️⃣ Room Amenities — assign all amenities to RoomType id=1 for demo
  const roomTypes: RoomType[] = await prisma.roomType.findMany();
  if (roomTypes.length) {
    for (const roomType of roomTypes) {
      for (const amenity of amenities) {
        await prisma.roomamenity.upsert({
          where: {
            roomTypeId_amenityId: {
              roomTypeId: roomType.id,
              amenityId: amenity.id,
            },
          },
          update: {},
          create: {
            roomTypeId: roomType.id,
            amenityId: amenity.id,
          },
        });
      }
    }
    console.log(`✅ Linked amenities to ${roomTypes.length} room types`);
  }

  // 3️⃣ Seasonal Rates — sample per room type
  const seasonalRatesData: { startDate: Date; endDate: Date; rate: number }[] = [
    { startDate: new Date('2025-12-15'), endDate: new Date('2026-01-10'), rate: 5000.0 },
    { startDate: new Date('2025-06-01'), endDate: new Date('2025-06-30'), rate: 4000.0 },
  ];
  for (const roomType of roomTypes) {
    for (const sr of seasonalRatesData) {
      await prisma.seasonalrate.upsert({
        where: {
          roomTypeId_startDate_endDate: {
            roomTypeId: roomType.id,
            startDate: sr.startDate,
            endDate: sr.endDate,
          },
        },
        update: { rate: sr.rate },
        create: {
          roomTypeId: roomType.id,
          startDate: sr.startDate,
          endDate: sr.endDate,
          rate: sr.rate,
        },
      });
    }
  }
  console.log(`✅ Seeded seasonal rates`);

  // 4️⃣ Booking Charges — only if bookings exist
  const bookings = await prisma.booking.findMany();
  for (const booking of bookings) {
    await prisma.bookingCharge.upsert({
      where: {
        bookingId_description: {
          bookingId: booking.id,
          description: 'Service Charge',
        },
      },
      update: { amount: 500.0, taxAmount: 90.0 },
      create: {
        bookingId: booking.id,
        description: 'Service Charge',
        amount: 500.0,
        taxAmount: 90.0,
      },
    });
  }
  console.log(`✅ Booking charges added to ${bookings.length} bookings`);

  // 5️⃣ POS Order Add-ons — only if posOrders exist
  const posOrders = await prisma.posOrder.findMany();
  for (const order of posOrders) {
    await prisma.posorderaddon.upsert({
      where: { posOrderId: order.id },
      update: { serviceChargePct: 5.0, orderType: 'DINE_IN' },
      create: {
        posOrderId: order.id,
        serviceChargePct: 5.0,
        orderType: 'DINE_IN',
      },
    });
  }
  console.log(`✅ POS order add-ons for ${posOrders.length} orders`);

  // 6️⃣ Licenses + Alerts
  const licenseNames = ['Liquor License', 'Fire Safety Certificate', 'Food Safety License'];
  for (const name of licenseNames) {
    const license = await prisma.license.upsert({
      where: { name },
      update: { expiryDate: new Date('2026-12-31') },
      create: { name, expiryDate: new Date('2026-12-31') },
    });

    await prisma.licenserenewalalert.upsert({
      where: {
        licenseId_renewalAlertDays: {
          licenseId: license.id,
          renewalAlertDays: 30,
        },
      },
      update: {},
      create: { licenseId: license.id, renewalAlertDays: 30 },
    });
  }
  console.log(`✅ Licenses and alerts seeded`);
}

main()
  .then(async () => {
    console.log('🌱 Add-on seed completed.');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
