import { useState } from "react";
import { Button } from "../common/Button";
import { Modal } from "../common/Modal";
import type { Debt } from "../../types/debt";
import type { PaymentMethod } from "../../types/operation";

interface PaymentModalProps {
  open: boolean;
  debt: Debt | null;
  onClose: () => void;
  onConfirm: (monto: number, metodo: PaymentMethod) => void;
}

const methods: PaymentMethod[] = ["efectivo", "yape", "plin", "transferencia"];
const labels: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  fiado: "Fiado",
  mixto: "Mixto",
};

export function PaymentModal({
  open,
  debt,
  onClose,
  onConfirm,
}: PaymentModalProps) {
  const [monto, setMonto] = useState<string>("");
  const [metodo, setMetodo] = useState<PaymentMethod>("efectivo");

  const handleConfirm = () => {
    const n = Number(monto);
    if (!n || n <= 0 || !debt) return;
    onConfirm(n, metodo);
    setMonto("");
    setMetodo("efectivo");
  };

  return (
    <Modal
      open={open}
      title="Registrar pago"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button
            fullWidth
            onClick={handleConfirm}
            disabled={!monto || Number(monto) <= 0}
          >
            Confirmar
          </Button>
        </>
      }
    >
      {debt ? (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="pay-client"
              className="block text-sm font-semibold text-ink mb-1.5"
            >
              Cliente
            </label>
            <input
              id="pay-client"
              type="text"
              value={debt.nombre}
              readOnly
              className="w-full rounded-xl border border-line bg-surface-alt px-4 py-3 text-base text-ink-soft"
            />
          </div>
          <div>
            <label
              htmlFor="pay-amount"
              className="block text-sm font-semibold text-ink mb-1.5"
            >
              Monto del pago
            </label>
            <input
              id="pay-amount"
              type="number"
              min={0}
              step={0.5}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink focus:border-primary-500 outline-none"
            />
            <p className="mt-1 text-xs text-ink-muted">
              Saldo actual: S/ {debt.saldo.toFixed(2)}
            </p>
          </div>
          <div>
            <span className="block text-sm font-semibold text-ink mb-1.5">
              Método de pago
            </span>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetodo(m)}
                  className={`rounded-lg py-2.5 px-2 text-sm font-medium min-h-[44px] transition-colors ${
                    metodo === m
                      ? "bg-primary-600 text-white"
                      : "bg-surface-elevated border border-line text-ink-soft hover:bg-surface-alt"
                  }`}
                >
                  {labels[m]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
