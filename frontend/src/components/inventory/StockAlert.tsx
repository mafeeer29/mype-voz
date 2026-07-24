import { AlertTriangle } from "lucide-react";

interface StockAlertProps {
  bajos: number;
  agotados: number;
}

export function StockAlert({ bajos, agotados }: StockAlertProps) {
  if (bajos === 0 && agotados === 0) return null;

  const parts: string[] = [];
  if (agotados > 0) {
    parts.push(
      `${agotados} producto${agotados > 1 ? "s" : ""} agotado${agotados > 1 ? "s" : ""}`,
    );
  }
  if (bajos > 0) {
    parts.push(
      `${bajos} producto${bajos > 1 ? "s" : ""} con stock bajo`,
    );
  }

  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3.5">
      <AlertTriangle size={18} className="text-amber-700 mt-0.5 shrink-0" />
      <p className="text-sm text-amber-800 font-medium leading-snug">
        {parts.join(" y ")}. Revisa tu inventario.
      </p>
    </div>
  );
}
