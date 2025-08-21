import { useAlerts } from "@/hooks/useAlerts";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function AlertsPanel() {
  const { alerts, loading } = useAlerts();

  if (loading) {
    return <div className="h-32 rounded-2xl border bg-white/50 dark:bg-slate-900/50 animate-pulse" />;
  }

  if (!alerts.length) {
    return (
      <div className="rounded-2xl border p-4 bg-green-50 dark:bg-green-900/30">
        <p className="text-green-700 dark:text-green-300 text-sm">✅ All systems normal</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="px-4 py-3 border-b dark:border-slate-700 font-semibold">Alerts</div>
      <ul className="divide-y dark:divide-slate-700">
        {alerts.map((a) => (
          <li key={a.id} className="px-4 py-3 flex items-start gap-3">
            {a.severity === "critical" ? (
              <AlertTriangle className="text-red-500 w-5 h-5 mt-0.5" />
            ) : a.severity === "warning" ? (
              <Info className="text-yellow-500 w-5 h-5 mt-0.5" />
            ) : (
              <CheckCircle className="text-blue-500 w-5 h-5 mt-0.5" />
            )}
            <span className="text-sm text-slate-700 dark:text-slate-300">{a.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
