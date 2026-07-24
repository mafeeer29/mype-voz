import { formatSoles } from "../../utils/currency";

interface CurrencyAmountProps {
  amount: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "default" | "positive" | "negative" | "muted";
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
};

const toneClasses = {
  default: "text-ink",
  positive: "text-primary-700",
  negative: "text-error-600",
  muted: "text-ink-muted",
};

export function CurrencyAmount({
  amount,
  className = "",
  size = "md",
  tone = "default",
}: CurrencyAmountProps) {
  return (
    <span
      className={`font-bold tabular-nums ${sizeClasses[size]} ${toneClasses[tone]} ${className}`}
    >
      {formatSoles(amount)}
    </span>
  );
}
