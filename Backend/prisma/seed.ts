import {
  PrismaClient,
  PermissionAction,
  PermissionResource,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import '../prisma.config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Create default roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'Super Admin' },
      update: {},
      create: {
        name: 'Super Admin',
        description: 'Full system access',
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        description: 'Administrative access',
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'User' },
      update: {},
      create: {
        name: 'User',
        description: 'Standard user access',
        isSystem: true,
      },
    }),
    // Organization-specific roles
    prisma.role.upsert({
      where: { name: 'Owner' },
      update: {},
      create: {
        name: 'Owner',
        description: 'Organization owner with full access',
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'Member' },
      update: {},
      create: {
        name: 'Member',
        description: 'Organization member with basic access',
        isSystem: true,
      },
    }),
  ]);

  console.log('✅ Created roles:', roles.map((r) => r.name).join(', '));

  // Create permissions
  const permissionData: Array<{
    action: PermissionAction;
    resource: PermissionResource;
    description: string;
  }> = [
    {
      action: PermissionAction.MANAGE,
      resource: PermissionResource.ALL,
      description: 'Full system access',
    },
    {
      action: PermissionAction.CREATE,
      resource: PermissionResource.USER,
      description: 'Create users',
    },
    {
      action: PermissionAction.READ,
      resource: PermissionResource.USER,
      description: 'Read users',
    },
    {
      action: PermissionAction.UPDATE,
      resource: PermissionResource.USER,
      description: 'Update users',
    },
    {
      action: PermissionAction.DELETE,
      resource: PermissionResource.USER,
      description: 'Delete users',
    },
    {
      action: PermissionAction.CREATE,
      resource: PermissionResource.ORGANIZATION,
      description: 'Create organizations',
    },
    {
      action: PermissionAction.READ,
      resource: PermissionResource.ORGANIZATION,
      description: 'Read organizations',
    },
    {
      action: PermissionAction.UPDATE,
      resource: PermissionResource.ORGANIZATION,
      description: 'Update organizations',
    },
    {
      action: PermissionAction.DELETE,
      resource: PermissionResource.ORGANIZATION,
      description: 'Delete organizations',
    },
    {
      action: PermissionAction.READ,
      resource: PermissionResource.PAYMENT,
      description: 'Read payments',
    },
    {
      action: PermissionAction.CREATE,
      resource: PermissionResource.PAYMENT,
      description: 'Create payments',
    },
    {
      action: PermissionAction.READ,
      resource: PermissionResource.AUDIT_LOG,
      description: 'Read audit logs',
    },
    {
      action: PermissionAction.CREATE,
      resource: PermissionResource.FILE,
      description: 'Upload files',
    },
    {
      action: PermissionAction.READ,
      resource: PermissionResource.FILE,
      description: 'Read files',
    },
    {
      action: PermissionAction.DELETE,
      resource: PermissionResource.FILE,
      description: 'Delete files',
    },
  ];

  const permissions = await Promise.all(
    permissionData.map((p) =>
      prisma.permission.upsert({
        where: { action_resource: { action: p.action, resource: p.resource } },
        update: {},
        create: p,
      }),
    ),
  );

  console.log('✅ Created permissions:', permissions.length);

  // Assign all permissions to Super Admin
  const superAdminRole = roles.find((r) => r.name === 'Super Admin');
  if (superAdminRole) {
    await Promise.all(
      permissions.map((permission) =>
        prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: superAdminRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        }),
      ),
    );
    console.log('✅ Assigned all permissions to Super Admin');
  }

  // Assign basic permissions to User role
  const userRole = roles.find((r) => r.name === 'User');
  if (userRole) {
    const userPermissions = permissions.filter(
      (p) =>
        (p.resource === 'USER' && p.action === 'READ') ||
        (p.resource === 'ORGANIZATION' && p.action === 'READ') ||
        (p.resource === 'FILE' && ['CREATE', 'READ'].includes(p.action)) ||
        (p.resource === 'PAYMENT' && ['CREATE', 'READ'].includes(p.action)),
    );

    await Promise.all(
      userPermissions.map((permission) =>
        prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: userRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: userRole.id,
            permissionId: permission.id,
          },
        }),
      ),
    );
    console.log('✅ Assigned basic permissions to User role');
  }

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
      roleId: superAdminRole?.id,
    },
  });

  console.log('✅ Created super admin user:', superAdmin.email);
  console.log('📧 Email:', superAdminEmail);
  console.log('🔑 Password:', superAdminPassword);
  console.log('⚠️  Please change the password after first login!');

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
