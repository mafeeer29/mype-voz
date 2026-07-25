import { useState } from "react";
import { Button } from "../common/Button";
import { CurrencyAmount } from "../common/CurrencyAmount";
import { OperationEditForm } from "./OperationEditForm";
import type {
  InterpretedOperation,
  PaymentMethod,
} from "../../types/operation";
import { formatSoles } from "../../utils/currency";

interface OperationConfirmationProps {
  operation: InterpretedOperation;
  onCancel: () => void;
  onConfirm: (op: InterpretedOperation) => void;
  confirming?: boolean;
}

const operationLabels: Record<string, string> = {
  venta: "Venta",
  gasto: "Gasto",
  venta_fiada: "Venta fiada",
  compra_mercaderia: "Compra de mercadería",
  pago_deuda: "Pago de deuda",
};

const paymentLabels: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  fiado: "Fiado",
  mixto: "Mixto",
};

export function OperationConfirmation({
  operation,
  onCancel,
  onConfirm,
  confirming = false,
}: OperationConfirmationProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<InterpretedOperation>(operation);

  if (editing) {
    return (
      <OperationEditForm
        draft={draft}
        onChange={setDraft}
        onBack={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Confirma la operación</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Revisa los datos antes de guardar.
        </p>
      </div>

      <div className="rounded-2xl bg-surface-elevated border border-line shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-sm font-semibold">
            {operationLabels[draft.tipo_operacion] ?? draft.tipo_operacion}
          </span>
          {draft.metodo_pago ? (
            <span className="text-sm font-medium text-ink-soft">
              {paymentLabels[draft.metodo_pago]}
            </span>
          ) : null}
        </div>

        <div className="space-y-2">
          {draft.productos.map((prod, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 py-2 border-b border-line last:border-0"
            >
              <div>
                <p className="text-base font-semibold text-ink">
                  {prod.cantidad} × {prod.nombre}
                </p>
                {prod.precio_unitario != null ? (
                  <p className="text-sm text-ink-muted">
                    {formatSoles(prod.precio_unitario)} cada una
                  </p>
                ) : null}
              </div>
              {prod.subtotal != null ? (
                <CurrencyAmount amount={prod.subtotal} tone="positive" />
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-base font-semibold text-ink">Total</span>
          <CurrencyAmount
            amount={draft.monto_total ?? 0}
            size="lg"
            tone="positive"
          />
        </div>

        <dl className="space-y-1.5 text-sm">
          {draft.metodo_pago ? (
            <div className="flex justify-between">
              <dt className="text-ink-muted">Método de pago</dt>
              <dd className="font-medium text-ink">
                {paymentLabels[draft.metodo_pago]}
              </dd>
            </div>
          ) : null}
          {draft.cliente ? (
            <div className="flex justify-between">
              <dt className="text-ink-muted">Cliente</dt>
              <dd className="font-medium text-ink">{draft.cliente}</dd>
            </div>
          ) : null}
          {draft.categoria_gasto ? (
            <div className="flex justify-between">
              <dt className="text-ink-muted">Categoría</dt>
              <dd className="font-medium text-ink">{draft.categoria_gasto}</dd>
            </div>
          ) : null}
          {draft.monto_fiado > 0 ? (
            <div className="flex justify-between">
              <dt className="text-ink-muted">Monto fiado</dt>
              <dd className="font-medium text-ink">
                {formatSoles(draft.monto_fiado)}
              </dd>
            </div>
          ) : null}
          {draft.registrado_por ? (
            <div className="flex justify-between">
              <dt className="text-ink-muted">Registrado por</dt>
              <dd className="font-medium text-ink">{draft.registrado_por}</dd>
            </div>
          ) : null}
        </dl>

        {draft.advertencias.length > 0 ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
            <p className="text-sm text-amber-800 font-medium">
              {draft.advertencias.join(" ")}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" fullWidth onClick={onCancel} disabled={confirming}>
          Cancelar
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => setEditing(true)}
          disabled={confirming}
        >
          Editar
        </Button>
        <Button
          fullWidth
          onClick={() => onConfirm(draft)}
          disabled={confirming}
        >
          {confirming ? "Guardando..." : "Confirmar"}
        </Button>
      </div>
    </div>
  );
}
