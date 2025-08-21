// pages/index.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function IndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push("/loginpage");
  }, [router]);

  return null;
}
