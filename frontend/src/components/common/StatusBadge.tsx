import type { ProductStatus } from "../../types/inventory";

type Tone = "success" | "warning" | "error" | "neutral";

interface StatusBadgeProps {
  tone: Tone;
  label: string;
  status?: ProductStatus;
}

const toneClasses: Record<Tone, string> = {
  success: "bg-primary-100 text-primary-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-700",
  neutral: "bg-surface-alt text-ink-soft",
};

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${toneClasses[tone]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          tone === "success"
            ? "bg-primary-600"
            : tone === "warning"
              ? "bg-amber-500"
              : tone === "error"
                ? "bg-red-500"
                : "bg-ink-muted"
        }`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
