import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: "default" | "positive" | "warning" | "negative";
}

const toneClasses = {
  default: "bg-surface-elevated",
  positive: "bg-primary-50",
  warning: "bg-amber-50",
  negative: "bg-red-50",
};

const iconTone = {
  default: "text-ink-soft bg-surface-alt",
  positive: "text-primary-700 bg-primary-100",
  warning: "text-amber-700 bg-amber-100",
  negative: "text-error-600 bg-red-100",
};

export function MetricCard({
  label,
  value,
  icon,
  tone = "default",
}: MetricCardProps) {
  return (
    <div
      className={`rounded-2xl p-4 shadow-sm border border-line ${toneClasses[tone]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-ink-soft font-medium leading-tight">
          {label}
        </span>
        <span
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconTone[tone]}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 text-xl font-bold text-ink tabular-nums">
        {value}
      </div>
    </div>
  );
}
