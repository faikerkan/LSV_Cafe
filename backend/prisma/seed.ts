import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Create admin user if not exists
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('✓ Admin user created (username: admin, password: admin123)');
  } else {
    console.log('✓ Admin user already exists.');
  }

  // 2. Seed Departments
  const departments = [
    { name: 'Halkla İlişkiler', code: 'PR' },
    { name: 'Kurumlarla İletişim', code: 'CORP_COMM' },
    { name: 'Gönüllü İletişimi', code: 'VOL_COMM' },
    { name: 'Kurumsal Halkla İlişkiler', code: 'CORP_PR' },
    { name: 'Sosyal Hizmetler', code: 'SOCIAL' },
    { name: 'Aktif İletişim', code: 'ACTIVE' },
    { name: 'FAYDA', code: 'FAYDA' },
    { name: 'İnci', code: 'INCI' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }
  console.log(`✓ ${departments.length} departments seeded.`);

  // 3. Seed Resources
  const resources = [
    { name: 'Kuru Pasta', type: 'consumable', exclusive: false },
    { name: 'Kutlama Pastası', type: 'consumable', exclusive: false },
    { name: 'Soğuk İçecek', type: 'consumable', exclusive: false },
    { name: 'Sıcak İçecek', type: 'consumable', exclusive: false },
    { name: 'Projeksiyon', type: 'equipment', exclusive: true },
    { name: 'Ses Sistemi', type: 'equipment', exclusive: true },
  ];

  for (const res of resources) {
    await prisma.resource.upsert({
      where: { name: res.name },
      update: {},
      create: res,
    });
  }
  console.log(`✓ ${resources.length} resources seeded.`);

  // 4. Seed Locations
  const locations = [
    { name: 'LSV Cafe', capacity: 50 },
  ];

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { name: loc.name },
      update: {},
      create: loc,
    });
  }
  console.log(`✓ ${locations.length} locations seeded.`);

  console.log('✓ Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });