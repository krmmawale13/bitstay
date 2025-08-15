import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@bitstay.com' },
    update: {},
    create: {
      tenantId: 1, // Make sure tenant 1 exists in DB
      name: 'System Admin',
      email: 'admin@bitstay.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
