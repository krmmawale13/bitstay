// apps/frontend/src/lib/auth.ts
// Temporary auth placeholder until API integration
export async function getCurrentUser() {
  // Call backend /api/v1/users/me once auth is ready
  return {
    id: 1,
    name: "Demo Admin",
    role: "ADMIN",
    email: "admin@bitstay.com"
  };
}
