import { RoleEnum } from '@prisma/client';

/** Canonical permission keys (use these everywhere) */
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

/** Default role → permissions mapping (edit anytime = one-click effect) */
export const ROLE_PERMISSIONS: Record<RoleEnum, PermissionKey[]> = {
  ADMIN: [...PERMISSIONS], // full
  MANAGER: [
    'dashboard.view',
    'customers.read', 'customers.write',
    'inventory.read', 'inventory.manage',
    'bars.read', 'bars.manage',
    'hotels.read', 'hotels.manage',
    'pos.use',
    'reports.view',
    'suppliers.read', 'suppliers.manage',
    'bookings.read', 'bookings.manage',
    'invoices.read', 'invoices.manage',
  ],
  STAFF: [
    'dashboard.view',
    'customers.read',
    'inventory.read',
    'bars.read',
    'hotels.read',
    'pos.use',
    'reports.view',
    'bookings.read',
    'invoices.read',
  ],
  VIEWER: [
    'dashboard.view',
    'customers.read',
    'reports.view',
  ],
};
