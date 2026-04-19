import { PrismaClient, UserRole, ChurchRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import '../prisma.config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Create default super admin user
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@example.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123';
  const passwordHash = await bcrypt.hash(superAdminPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      userRole: UserRole.SUPER_ADMIN,
    },
  });

  console.log('✅ Created super admin user:', superAdmin.email);
  console.log('📧 Email:', superAdminEmail);
  console.log('🔑 Password:', superAdminPassword);
  console.log('⚠️  Please change the password after first login!');

  // Create a church
  const church = await prisma.church.upsert({
    where: { slug: 'grace-community-church' },
    update: {},
    create: {
      name: 'Grace Community Church',
      slug: 'grace-community-church',
      description: 'A welcoming community of faith',
      isActive: true,
    },
  });
  console.log('✅ Created church:', church.name);

  // Church admin member
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'churchadmin@example.com' },
    update: {},
    create: {
      email: 'churchadmin@example.com',
      passwordHash: adminHash,
      firstName: 'Church',
      lastName: 'Admin',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      userRole: UserRole.USER,
    },
  });
  await prisma.churchMember.upsert({
    where: { churchId_userId: { churchId: church.id, userId: adminUser.id } },
    update: {},
    create: {
      churchId: church.id,
      userId: adminUser.id,
      role: ChurchRole.ADMIN,
    },
  });
  console.log('✅ Church admin: churchadmin@example.com / Admin@123');

  // Regular member
  const memberHash = await bcrypt.hash('Member@123', 10);
  const memberUser = await prisma.user.upsert({
    where: { email: 'member@example.com' },
    update: {},
    create: {
      email: 'member@example.com',
      passwordHash: memberHash,
      firstName: 'John',
      lastName: 'Member',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      userRole: UserRole.USER,
    },
  });
  await prisma.churchMember.upsert({
    where: { churchId_userId: { churchId: church.id, userId: memberUser.id } },
    update: {},
    create: {
      churchId: church.id,
      userId: memberUser.id,
      role: ChurchRole.MEMBER,
    },
  });
  console.log('✅ Member: member@example.com / Member@123');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
