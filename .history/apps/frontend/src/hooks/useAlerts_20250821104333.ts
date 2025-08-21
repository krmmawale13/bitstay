import { useEffect, useState } from "react";

export interface Alert {
  id: string;
  type: "license" | "inventory" | "invoice" | "booking";
  message: string;
  severity: "info" | "warning" | "critical";
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/dashboard/alerts`, {
          headers: { "x-tenant-id": process.env.DEFAULT_TENANT_ID || "1" },
        });
        const data = await res.json();
        setAlerts(data);
      } catch (e) {
        console.error("Failed to load alerts", e);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { alerts, loading };
}
