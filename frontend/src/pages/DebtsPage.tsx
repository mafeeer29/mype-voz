import { useMemo, useState } from "react";
import { Search, Wallet, Users } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { DebtCard } from "../components/debts/DebtCard";
import { PaymentModal } from "../components/debts/PaymentModal";
import { EmptyState } from "../components/common/EmptyState";
import { CurrencyAmount } from "../components/common/CurrencyAmount";
import { useApp } from "../context/AppContext";
import type { Debt } from "../types/debt";
import type { PaymentMethod } from "../types/operation";

export function DebtsPage() {
  const { debts, setDebts, setSummary } = useApp();
  const [query, setQuery] = useState("");
  const [payDebt, setPayDebt] = useState<Debt | null>(null);

  const totalDeuda = useMemo(
    () => debts.reduce((sum, d) => sum + d.saldo, 0),
    [debts],
  );

  const filtered = useMemo(() => {
    return debts.filter((d) =>
      d.nombre.toLowerCase().includes(query.trim().toLowerCase()),
    );
  }, [debts, query]);

  const handleConfirmPayment = (monto: number, _metodo: PaymentMethod) => {
    if (!payDebt) return;
    setDebts((prev) =>
      prev.map((d) =>
        d.id === payDebt.id
          ? { ...d, saldo: Math.max(0, Number((d.saldo - monto).toFixed(2))) }
          : d,
      ),
    );
    setSummary((s) => ({
      ...s,
      montoFiado: Math.max(0, Number((s.montoFiado - monto).toFixed(2))),
      dineroRecibido: Number((s.dineroRecibido + monto).toFixed(2)),
    }));
    setPayDebt(null);
  };

  return (
    <PageContainer>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Deudas</h1>
          <p className="text-sm text-ink-soft">
            Clientes con pagos pendientes
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-surface-elevated border border-line shadow-sm p-4">
            <div className="flex items-center gap-2 text-ink-soft">
              <Wallet size={18} aria-hidden="true" />
              <span className="text-sm font-medium">Deuda total</span>
            </div>
            <CurrencyAmount
              amount={totalDeuda}
              size="xl"
              tone="negative"
              className="mt-2 block"
            />
          </div>
          <div className="rounded-2xl bg-surface-elevated border border-line shadow-sm p-4">
            <div className="flex items-center gap-2 text-ink-soft">
              <Users size={18} aria-hidden="true" />
              <span className="text-sm font-medium">Clientes</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink tabular-nums">
              {debts.filter((d) => d.saldo > 0).length}
            </p>
          </div>
        </div>

        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente..."
            aria-label="Buscar cliente"
            className="w-full rounded-xl border border-line-strong bg-surface-elevated pl-10 pr-4 py-3 text-base text-ink focus:border-primary-500 outline-none"
          />
        </div>

        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((d) => (
              <DebtCard
                key={d.id}
                debt={d}
                onRegisterPayment={setPayDebt}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Wallet size={32} />}
            title="Sin deudas"
            description="Ningún cliente coincide con tu búsqueda."
          />
        )}
      </div>

      <PaymentModal
        open={payDebt !== null}
        debt={payDebt}
        onClose={() => setPayDebt(null)}
        onConfirm={handleConfirmPayment}
      />
    </PageContainer>
  );
}
