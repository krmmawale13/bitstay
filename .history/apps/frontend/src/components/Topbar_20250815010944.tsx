// apps/frontend/src/components/Topbar.tsx
import { useEffect, useState } from "react";
import { User } from "@/types/user";
import axios from "axios";

export default function Topbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    axios.get("/api/v1/auth/me")
      .then((res) => {
        setUser(res.data as User);
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
      });
  }, []);

  return (
    <header className="flex justify-between items-center px-6 py-3 bg-white shadow">
      <h1 className="text-xl font-semibold">BitStay</h1>
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <span className="text-gray-700">{user.fullName}</span>
            <img
              src={user.avatarUrl || "/default-avatar.png"}
              alt="User Avatar"
              className="w-8 h-8 rounded-full"
            />
          </>
        ) : (
          <span>Loading...</span>
        )}
      </div>
    </header>
  );
}
