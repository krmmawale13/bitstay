import { useEffect, useState } from "react";
import api from "@/services/api";

export type BookingMixRow = { status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED"; count: number };

export function useBookingMixToday() {
  const [data, setData] = useState<BookingMixRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await api.get<BookingMixRow[]>("/dashboard/booking-mix-today");
        if (mounted) setData(res.data);
      } catch (e: any) {
        if (mounted) setErr(e?.response?.data?.message || e?.message || "Failed to load booking mix");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { data, loading, error };
}
