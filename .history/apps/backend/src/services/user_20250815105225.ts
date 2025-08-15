// apps/frontend/src/types/user.ts
export type Role = "ADMIN" | "STAFF" | "OWNER" | "USER" | string;

export interface User {
  id: string | number;
  email: string;
  name?: string | null;
  role?: Role | null;
  avatarUrl?: string | null;
}
