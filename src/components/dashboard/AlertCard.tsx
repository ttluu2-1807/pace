"use client";

import Link from "next/link";
import type { DailyAlert } from "@/lib/daily-intelligence";

interface AlertCardProps {
  alert: DailyAlert;
}

const SEVERITY_STYLES: Record<
  DailyAlert["severity"],
  { card: string; title: string; message: string; button: string }
> = {
  critical: {
    card: "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/40",
    title: "text-red-900 dark:text-red-200",
    message: "text-red-800 dark:text-red-300",
    button:
      "border-red-400 text-red-800 hover:bg-red-100 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/30",
  },
  warning: {
    card: "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40",
    title: "text-amber-900 dark:text-amber-200",
    message: "text-amber-800 dark:text-amber-300",
    button:
      "border-amber-400 text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/30",
  },
  info: {
    card: "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40",
    title: "text-slate-800 dark:text-slate-200",
    message: "text-slate-600 dark:text-slate-400",
    button:
      "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50",
  },
};

export function AlertCard({ alert }: AlertCardProps) {
  const styles = SEVERITY_STYLES[alert.severity];

  return (
    <div className={`rounded-xl border px-4 py-3 ${styles.card}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="text-lg leading-tight shrink-0 mt-0.5" aria-hidden="true">
          {alert.icon}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className={`text-sm font-semibold leading-snug ${styles.title}`}>
            {alert.title}
          </p>
          <p className={`text-xs leading-relaxed ${styles.message}`}>
            {alert.message}
          </p>

          {/* Action button */}
          {alert.action && (
            <div className="pt-1">
              <Link href={alert.action.href}>
                <button
                  className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${styles.button}`}
                >
                  {alert.action.label}
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
