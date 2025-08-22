import { RoleEnum } from '@prisma/client';

export const PERMISSIONS = [
  'dashboard.view',

  'customers.read',
  'customers.write',

  'inventory.read',
  'inventory.manage',

  'bars.read',
  'bars.manage',

  'hotels.read',
  'hotels.manage',

  'pos.use',

  'reports.view',
  'reports.manage',

  'suppliers.read',
  'suppliers.manage',

  'bookings.read',
  'bookings.manage',

  'invoices.read',
  'invoices.manage',
] as const;

export type PermissionKey = typeof PERMISSIONS[number];

/**
 * Role → base permissions mapping
 * aligned 1:1 with your schema RoleEnum:
 * ADMIN | MANAGER | RECEPTIONIST | CASHIER | WAITER | HOUSEKEEPING
 */
export const ROLE_PERMISSIONS: Record<RoleEnum, PermissionKey[]> = {
  [RoleEnum.ADMIN]: [...PERMISSIONS],

  [RoleEnum.MANAGER]: [
    'dashboard.view',
    'customers.read', 'customers.write',
    'inventory.read', 'inventory.manage',
    'bars.read', 'bars.manage',
    'hotels.read', 'hotels.manage',
    'pos.use',
    'reports.view', 'reports.manage',
    'suppliers.read', 'suppliers.manage',
    'bookings.read', 'bookings.manage',
    'invoices.read', 'invoices.manage',
  ],

  [RoleEnum.RECEPTIONIST]: [
    'dashboard.view',
    'customers.read', 'customers.write',
    'bookings.read', 'bookings.manage',
    'invoices.read', 'invoices.manage',
  ],

  [RoleEnum.CASHIER]: [
    'dashboard.view',
    'pos.use',
    'invoices.read', 'invoices.manage',
    'reports.view',
  ],

  [RoleEnum.WAITER]: [
    'dashboard.view',
    'customers.read',
    'pos.use',
  ],

  [RoleEnum.HOUSEKEEPING]: [
    'dashboard.view',
    'hotels.read',
  ],
};
