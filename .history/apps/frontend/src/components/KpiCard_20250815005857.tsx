// src/components/KpiCard.tsx
import { useEffect, useState } from "react";

interface KpiCardProps {
  title: string;
  endpoint: string; // API endpoint to fetch the KPI value
  prefix?: string;  // e.g., "₹"
  suffix?: string;  // e.g., "%"
}

export default function KpiCard({ title, endpoint, prefix = "", suffix = "" }: KpiCardProps) {
  const [value, setValue] = useState<string | number>("--");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchKpi() {
      try {
        setLoading(true);
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`Error fetching ${title}`);
        const data = await res.json();
        
        // Assuming API returns: { value: number }
        setValue(data.value ?? "--");
      } catch (error) {
        console.error(`Failed to fetch ${title}:`, error);
        setValue("--");
      } finally {
        setLoading(false);
      }
    }
    fetchKpi();
  }, [endpoint, title]);

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
      <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
      {loading ? (
        <span className="text-gray-400 text-lg mt-2">Loading...</span>
      ) : (
        <span className="text-2xl font-bold text-[#007B83] dark:text-[#1E90A1] mt-2">
          {prefix}{value}{suffix}
        </span>
      )}
    </div>
  );
}
