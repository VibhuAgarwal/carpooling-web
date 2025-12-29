"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ToastVariant = "success" | "error" | "info" | "warning";

type ToastPayload = {
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastItem = Required<Pick<ToastPayload, "message">> &
  ToastPayload & {
    id: string;
    createdAt: number;
  };

const EVENT_NAME = "carpooling:toast";

function uid() {
  // crypto.randomUUID where available; fallback for older browsers.
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const toast = {
  show(payload: ToastPayload) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
  },
  success(message: string, title = "Booked") {
    this.show({ message, title, variant: "success" });
  },
  error(message: string, title = "Couldn’t do that") {
    this.show({ message, title, variant: "error" });
  },
  info(message: string, title = "Heads up") {
    this.show({ message, title, variant: "info" });
  },
  warning(message: string, title = "Check this") {
    this.show({ message, title, variant: "warning" });
  },
};

export function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const styles = useMemo(() => {
    const byVariant: Record<
      ToastVariant,
      { shell: string; badge: string; icon: JSX.Element }
    > = {
      success: {
        shell:
          "border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-white",
        badge: "bg-emerald-600",
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      error: {
        shell: "border-rose-200 bg-gradient-to-r from-rose-50 via-white to-white",
        badge: "bg-rose-600",
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      info: {
        shell: "border-sky-200 bg-gradient-to-r from-sky-50 via-white to-white",
        badge: "bg-sky-600",
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
            <path
              d="M12 16v-5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M12 8h.01"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M22 12a10 10 0 11-20 0 10 10 0 0120 0z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
      },
      warning: {
        shell:
          "border-amber-200 bg-gradient-to-r from-amber-50 via-white to-white",
        badge: "bg-amber-600",
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
            <path
              d="M12 9v4"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M12 17h.01"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M10.3 4.6l-8 14A2 2 0 004.1 22h15.8a2 2 0 001.8-3.4l-8-14a2 2 0 00-3.4 0z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
      },
    };
    return byVariant;
  }, []);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastPayload>).detail;
      if (!detail?.message) return;

      const id = uid();
      const variant: ToastVariant = detail.variant ?? "info";

      const next: ToastItem = {
        id,
        createdAt: Date.now(),
        variant,
        title: detail.title,
        message: detail.message,
        durationMs: detail.durationMs ?? 3500,
      };

      setItems((prev) => [next, ...prev].slice(0, 4));

      const t = window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== id));
        timersRef.current.delete(id);
      }, next.durationMs);

      timersRef.current.set(id, t);
    };

    window.addEventListener(EVENT_NAME, onToast);
    return () => {
      window.removeEventListener(EVENT_NAME, onToast);
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[1000] w-[min(420px,calc(100vw-2rem))] space-y-3">
      {items.map((t) => {
        const v = (t.variant ?? "info") as ToastVariant;
        const s = styles[v];

        return (
          <div
            key={t.id}
            className={[
              "group relative overflow-hidden rounded-xl border shadow-lg",
              "backdrop-blur supports-[backdrop-filter]:bg-white/60",
              "animate-[toast-in_180ms_ease-out]",
              s.shell,
            ].join(" ")}
          >
            <div className="flex gap-3 p-4">
              <div
                className={[
                  "mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg",
                  s.badge,
                ].join(" ")}
                aria-hidden
              >
                {s.icon}
              </div>

              <div className="min-w-0 flex-1">
                {t.title ? (
                  <div className="text-sm font-semibold text-gray-900">
                    {t.title}
                  </div>
                ) : null}
                <div className="text-sm text-gray-700">{t.message}</div>
              </div>

              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                className="rounded-md px-2 py-1 text-gray-400 hover:text-gray-700"
                aria-label="Dismiss"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="h-1 w-full bg-gray-100">
              <div
                className={["h-1", s.badge, "animate-[toast-bar_3.5s_linear]"].join(
                  " "
                )}
                style={{
                  animationDuration: `${(t.durationMs ?? 350) / 1000}s`,
                }}
              />
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toast-bar {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
