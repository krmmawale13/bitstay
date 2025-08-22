// apps/frontend/src/types/user.ts
import type { RoleEnum } from "@prisma/client";

export type Role = RoleEnum; 

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  tenants: number[];         // important for multi-tenant handling
}
