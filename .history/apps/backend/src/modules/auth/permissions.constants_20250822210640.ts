import { RoleEnum } from '@prisma/client';

export const PERMISSIONS = [
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
  // NEW: restrict Access Control management
  'settings.access.manage',
] as const;

export type PermissionKey = typeof PERMISSIONS[number];

export const ROLE_PERMISSIONS: Record<RoleEnum, PermissionKey[]> = {
  ADMIN: [...PERMISSIONS],
  MANAGER: [
    'dashboard.view',
    'customers.read','customers.write',
    'inventory.read','inventory.manage',
    'bars.read','bars.manage',
    'hotels.read','hotels.manage',
    'pos.use',
    'reports.view','reports.manage',
    'suppliers.read','suppliers.manage',
    'bookings.read','bookings.manage',
    'invoices.read','invoices.manage',
  ],
  RECEPTIONIST: [
    'dashboard.view',
    'customers.read','customers.write',
    'bookings.read','bookings.manage',
    'invoices.read','invoices.manage',
  ],
  CASHIER: [
    'dashboard.view',
    'pos.use',
    'invoices.read','invoices.manage',
    'reports.view',
  ],
  WAITER: [
    'dashboard.view',
    'customers.read',
    'pos.use',
  ],
  HOUSEKEEPING: [
    'dashboard.view',
    'hotels.read',
  ],
};
