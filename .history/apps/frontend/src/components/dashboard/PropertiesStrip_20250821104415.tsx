import { useProperties } from "@/hooks/useProperties";
import { Building2, Users, Wine, Boxes } from "lucide-react";

export default function PropertiesStrip() {
  const { stats, loading } = useProperties();

  if (loading) {
    return <div className="h-24 rounded-xl border bg-white/50 dark:bg-slate-900/50 animate-pulse" />;
  }

  const icons: Record<string, JSX.Element> = {
    hotel: <Building2 className="w-5 h-5" />,
    customer: <Users className="w-5 h-5" />,
    bar: <Wine className="w-5 h-5" />,
    inventory: <Boxes className="w-5 h-5" />,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.id}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-4 flex items-center gap-3"
        >
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">{icons[s.type]}</div>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{s.name}</div>
            <div className="text-lg font-semibold">{s.count}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
