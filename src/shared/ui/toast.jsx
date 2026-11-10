import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { ToastContext } from "./toast-context";
import "./toast.css";

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const notify = useCallback((message, options = {}) => {
    if (!message) return;
    const id = ++nextId.current;
    setToasts((current) => [...current.slice(-3), { id, message, type: "success", ...options }]);
  }, []);
  const dismiss = useCallback(
    (id) => setToasts((current) => current.filter((toast) => toast.id !== id)),
    [],
  );
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-region" aria-label="Thông báo">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} dismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, dismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), toast.type === "error" ? 7000 : 5000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.type, dismiss]);
  const Icon = toast.type === "error" ? CircleAlert : toast.type === "info" ? Info : CheckCircle2;
  return (
    <div
      className={`app-toast app-toast-${toast.type}`}
      role={toast.type === "error" ? "alert" : "status"}
      aria-atomic="true"
    >
      <Icon className="toast-icon" aria-hidden="true" />
      <div className="toast-content">
        <p>{toast.message}</p>
        {toast.action && (
          <a href={toast.action.to} onClick={() => dismiss(toast.id)}>
            {toast.action.label}
          </a>
        )}
      </div>
      <button type="button" aria-label="Đóng thông báo" onClick={() => dismiss(toast.id)}>
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
