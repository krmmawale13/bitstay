import { useEffect, useState } from "react";
import api from "@/services/api";

export type RevenuePoint = { date: string; rooms: number; pos: number };
export type Revenue7d = { days: RevenuePoint[] };

export function useRevenue7d() {
  const [data, setData] = useState<Revenue7d | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await api.get<Revenue7d>("/dashboard/revenue-7d");
        if (mounted) setData(res.data);
      } catch (e: any) {
        if (mounted) setErr(e?.response?.data?.message || e?.message || "Failed to load revenue");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { data, loading, error };
}

// ensure this file is a module even if TS config is strict (already has exports)
