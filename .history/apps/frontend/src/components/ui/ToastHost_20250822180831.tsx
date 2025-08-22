import { useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

declare global {
  interface Window {
    __toast?: {
      push: (t: { type?: 'success' | 'error' | 'info'; message: string; description?: string; duration?: number }) => void;
      clear?: () => void;
    };
  }
}

export default function ToastHost() {
  const { toasts, addToast, removeToast, clearToasts } = useToast();

  // bridge: window.__toast.push(...) -> addToast(...)
  useEffect(() => {
    const api = {
      push: (t: { type?: 'success' | 'error' | 'info'; message: string; description?: string; duration?: number }) =>
        addToast(t),
      clear: () => clearToasts(),
    };
    window.__toast = api;
    return () => {
      if (window.__toast === api) delete window.__toast;
    };
  }, [addToast, clearToasts]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <div className="absolute right-3 top-3 flex flex-col gap-2 w-[min(92vw,380px)]">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`
              pointer-events-auto rounded-xl border shadow-md px-3 py-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur
              ${t.type === 'success' ? 'border-emerald-200 dark:border-emerald-800' :
                t.type === 'error' ? 'border-rose-200 dark:border-rose-800' :
                'border-slate-200 dark:border-slate-700'}
            `}
            role="status"
          >
            <div className="flex items-start gap-2">
              <div className={`
                mt-0.5 h-2.5 w-2.5 rounded-full
                ${t.type === 'success' ? 'bg-emerald-500' :
                  t.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'}
              `} />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t.message}
                </div>
                {t.description ? (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t.description}</div>
                ) : null}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="ml-2 text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
