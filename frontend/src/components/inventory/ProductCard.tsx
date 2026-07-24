import { Package } from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";
import { CurrencyAmount } from "../common/CurrencyAmount";
import type { Product } from "../../types/inventory";

interface ProductCardProps {
  product: Product;
}

const statusMap = {
  disponible: { tone: "success" as const, label: "Disponible" },
  stock_bajo: { tone: "warning" as const, label: "Stock bajo" },
  agotado: { tone: "error" as const, label: "Agotado" },
};

export function ProductCard({ product }: ProductCardProps) {
  const status = statusMap[product.estado];
  const initial = product.nombre.charAt(0).toUpperCase();

  return (
    <div className="rounded-2xl bg-surface-elevated border border-line shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base font-semibold text-ink truncate">
                {product.nombre}
              </p>
              <p className="text-xs text-ink-muted">{product.categoria}</p>
            </div>
            <StatusBadge tone={status.tone} label={status.label} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-sm text-ink-soft">
              <Package size={15} aria-hidden="true" />
              <span className="tabular-nums">
                {product.stock_actual} / {product.stock_minimo} mín.
              </span>
            </div>
            <CurrencyAmount amount={product.precio} size="sm" tone="muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
