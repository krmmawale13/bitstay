import { useEffect, useState } from "react";
import api from "@/services/api";

export type DashboardSummary = {
  bookingsToday: number;
  occupancyPct: number;
  rooms: { occupiedRooms: number; totalRooms: number };
  revenueToday: { rooms: number; pos: number; total: number };
  cashCollectedToday: number;
  ops: { checkinsDue: number; checkoutsDue: number };
  risks: { invoicesDue: number; licensesExpiring30d: number; lowStockItems: number };
  generatedAt: string;
};

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await api.get<DashboardSummary>("/dashboard/summary");
        if (mounted) setData(res.data);
      } catch (e: any) {
        if (mounted) setErr(e?.response?.data?.message || e?.message || "Failed to load summary");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { data, loading, error };
}
