import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";

export default function HomePage() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const data = await getCurrentUser();
      setUser(data);
    }
    fetchUser();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Welcome to BitStay</h1>
      {user ? (
        <p className="mt-2">
          Logged in as <strong>{user.name}</strong> ({user.role})
        </p>
      ) : (
        <p className="mt-2">Loading user info...</p>
      )}
    </main>
  );
}
