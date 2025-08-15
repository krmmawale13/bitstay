// src/lib/auth.ts
export function isAuthenticated() {
  return Boolean(localStorage.getItem("token"));
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/loginPage";
}
