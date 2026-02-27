import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto animate-slide-up rounded-xl border shadow-lg px-4 py-3 text-sm font-medium flex items-center gap-2 min-w-[240px] max-w-[360px] bg-white dark:bg-surface border-slate-200 dark:border-dark-border text-slate-800 dark:text-white"
            role="status"
          >
            {t.type === 'success' && (
              <span className="size-5 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 shrink-0">✓</span>
            )}
            {t.type === 'error' && (
              <span className="size-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">!</span>
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || { addToast: () => {} };
}
