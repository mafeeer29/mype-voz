import { Wallet } from "lucide-react";
import { Button } from "../common/Button";
import { CurrencyAmount } from "../common/CurrencyAmount";
import type { Debt } from "../../types/debt";

interface DebtCardProps {
  debt: Debt;
  onRegisterPayment: (debt: Debt) => void;
}

export function DebtCard({ debt, onRegisterPayment }: DebtCardProps) {
  const initial = debt.cliente.charAt(0).toUpperCase();

  return (
    <div className="rounded-2xl bg-surface-elevated border border-line shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-secondary-500/15 text-secondary-600 flex items-center justify-center font-bold text-lg shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-ink">{debt.cliente}</p>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-sm text-ink-muted">Debe</span>
            <CurrencyAmount amount={debt.saldo_pendiente} tone="negative" />
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Estado: {debt.estado}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        fullWidth
        className="mt-3"
        onClick={() => onRegisterPayment(debt)}
      >
        <Wallet size={16} />
        Registrar pago
      </Button>
    </div>
  );
}
