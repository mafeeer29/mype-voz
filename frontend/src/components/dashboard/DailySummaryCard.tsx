import { TrendingUp, AlertCircle } from "lucide-react";
import { formatSoles } from "../../utils/currency";
import type { DailySummary } from "../../types/summary";

interface DailySummaryCardProps {
  summary: DailySummary;
}

export function DailySummaryCard({ summary }: DailySummaryCardProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-5 text-white shadow-md">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={18} aria-hidden="true" />
        <h2 className="text-base font-semibold">¿Cómo va el negocio hoy?</h2>
      </div>
      <p className="text-sm text-primary-50 leading-relaxed">
        Vendiste {formatSoles(summary.ventasTotales)} y tienes{" "}
        {formatSoles(summary.montoFiado)} pendientes de cobro.
      </p>
      {summary.productosStockBajo > 0 ? (
        <div className="mt-4 flex items-start gap-2 bg-white/15 rounded-xl p-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium leading-snug">
            {summary.productosStockBajo} producto
            {summary.productosStockBajo > 1 ? "s" : ""} necesita
            {summary.productosStockBajo > 1 ? "n" : ""} reposición.
          </p>
        </div>
      ) : null}
    </div>
  );
}
