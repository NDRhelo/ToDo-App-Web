"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Toast = {
  id: number;
  message: string;
  variant: "success" | "error";
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message: string, variant: Toast["variant"] = "error") => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, variant }]);
    timers.current.set(id, setTimeout(() => dismiss(id), variant === "error" ? 8000 : 6000));
  }, [dismiss]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach(clearTimeout);
      activeTimers.clear();
    };
  }, []);

  return { toasts, notify, dismiss };
}

export function Toaster({ toasts, dismiss }: {
  toasts: Toast[];
  dismiss: (id: number) => void;
}) {
  return (
    <div aria-label="Notificaciones" className="pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col gap-3 overflow-y-auto px-4 sm:left-auto sm:right-6 sm:mx-0 sm:px-0">
      {toasts.map(({ id, message, variant }) => (
        <div key={id} role={variant === "error" ? "alert" : "status"} aria-atomic="true"
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-zinc-900 p-4 text-sm text-zinc-100 shadow-2xl ${variant === "error" ? "border-red-500/40" : "border-violet-500/50"}`}>
          <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold ${variant === "error" ? "bg-red-500/10 text-red-400" : "bg-violet-500/15 text-violet-400"}`}>
            {variant === "error" ? "!" : "✓"}
          </span>
          <p className="min-w-0 flex-1 break-words pt-0.5">{message}</p>
          <button type="button" aria-label="Cerrar notificación" onClick={() => dismiss(id)}
            className="shrink-0 cursor-pointer rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-500">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
      ))}
    </div>
  );
}
