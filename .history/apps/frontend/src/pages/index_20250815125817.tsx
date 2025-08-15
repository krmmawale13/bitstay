// src/pages/index.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { isAuthenticated } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboardPage");
    } else {
      router.replace("/loginPage");
    }
  }, [router]);

  return null;
}
