import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: create if not exists
async function ensureSingle(model: any, fieldName: string, value: any) {
  const existing = await model.findFirst({ where: { [fieldName]: value } });
  if (!existing) {
    return model.create({ data: { [fieldName]: value } });
  }
  return existing;
}

// Helper: create or update by match fields
async function createOrUpdateBy(model: any, matchFields: Record<string, any>, newData: Record<string, any>) {
  const existing = await model.findFirst({ where: matchFields });
  if (existing) {
    return model.update({ where: { id: existing.id }, data: newData });
  }
  return model.create({ data: newData });
}

async function main() {
  console.log('🌱 Running CRUD-ready metadata seed...');

  // CREATE Example
  await ensureSingle(prisma.paymentMode, 'mode', 'QR Pay');

  // READ Example
  const paymentModes = await prisma.paymentMode.findMany();
  console.log('📄 Payment Modes:', paymentModes);

  // UPDATE Example
  await createOrUpdateBy(prisma.taxGroup, { name: 'GST 18%' }, {
    name: 'GST 18%',
    rate: '18.50'
  });

  // DELETE Example
  await prisma.paymentMode.deleteMany({ where: { mode: 'ToDeleteExample' } });

  console.log('✅ CRUD operations completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
