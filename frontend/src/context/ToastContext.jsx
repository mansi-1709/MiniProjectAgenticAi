import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx.showToast;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

const ICONS = {
  success: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const STYLES = {
  success: {
    wrapper: 'bg-emerald-600 text-white border-emerald-500',
    bar: 'bg-emerald-300',
  },
  error: {
    wrapper: 'bg-red-600 text-white border-red-500',
    bar: 'bg-red-300',
  },
  warning: {
    wrapper: 'bg-amber-500 text-white border-amber-400',
    bar: 'bg-amber-200',
  },
  info: {
    wrapper: 'bg-blue-600 text-white border-blue-500',
    bar: 'bg-blue-300',
  },
};

function ToastContainer({ toasts, dismiss }) {
  return (
    <div
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 items-end pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const style = STYLES[toast.type] || STYLES.info;
        return (
          <div
            key={toast.id}
            className={`toast-item pointer-events-auto flex flex-col w-80 max-w-[90vw] rounded-xl border shadow-2xl overflow-hidden ${style.wrapper}`}
            onClick={() => dismiss(toast.id)}
            role="alert"
          >
            <div className="flex items-start gap-3 px-4 py-3.5">
              <span className="mt-0.5 opacity-90">{ICONS[toast.type] || ICONS.info}</span>
              <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
              <button
                className="opacity-70 hover:opacity-100 transition-opacity mt-0.5"
                onClick={(e) => { e.stopPropagation(); dismiss(toast.id); }}
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div
              className={`h-1 ${style.bar} toast-progress`}
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          </div>
        );
      })}
    </div>
  );
}
