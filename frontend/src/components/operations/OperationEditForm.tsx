import { Button } from "../common/Button";
import type {
  InterpretedOperation,
  InterpretedProduct,
  PaymentMethod,
  OperationType,
} from "../../types/operation";

interface OperationEditFormProps {
  draft: InterpretedOperation;
  onChange: (op: InterpretedOperation) => void;
  onBack: () => void;
}

const paymentOptions: PaymentMethod[] = [
  "efectivo",
  "yape",
  "plin",
  "tarjeta",
  "transferencia",
  "fiado",
];

const paymentLabels: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  fiado: "Fiado",
  mixto: "Mixto",
};

const operationTypeOptions: { value: OperationType; label: string }[] = [
  { value: "venta", label: "Venta" },
  { value: "gasto", label: "Gasto" },
  { value: "venta_fiada", label: "Venta fiada" },
  { value: "compra_mercaderia", label: "Compra de mercadería" },
  { value: "pago_deuda", label: "Pago de deuda" },
];

function recalcSubtotal(prod: InterpretedProduct): InterpretedProduct {
  if (prod.precio_unitario != null) {
    return {
      ...prod,
      subtotal: Number((prod.cantidad * prod.precio_unitario).toFixed(2)),
    };
  }
  return prod;
}

function recalcTotal(op: InterpretedOperation): InterpretedOperation {
  const total = op.productos.reduce(
    (sum, p) => sum + (p.subtotal ?? 0),
    0,
  );
  return {
    ...op,
    monto_total: Number(total.toFixed(2)),
    monto_pagado: op.metodo_pago === "fiado" ? 0 : Number(total.toFixed(2)),
    monto_fiado: op.metodo_pago === "fiado" ? Number(total.toFixed(2)) : 0,
  };
}

export function OperationEditForm({
  draft,
  onChange,
  onBack,
}: OperationEditFormProps) {
  const updateProduct = (index: number, patch: Partial<InterpretedProduct>) => {
    const productos = draft.productos.map((p, i) =>
      i === index ? recalcSubtotal({ ...p, ...patch }) : p,
    );
    onChange(recalcTotal({ ...draft, productos }));
  };

  const setPayment = (m: PaymentMethod) => {
    onChange(recalcTotal({ ...draft, metodo_pago: m }));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Editar operación</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Ajusta los datos que necesites.
        </p>
      </div>

      <div>
        <label
          htmlFor="op-type"
          className="block text-sm font-semibold text-ink mb-1.5"
        >
          Tipo de operación
        </label>
        <select
          id="op-type"
          value={draft.tipo_operacion}
          onChange={(e) =>
            onChange({ ...draft, tipo_operacion: e.target.value as OperationType })
          }
          className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
        >
          {operationTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {draft.productos.map((prod, i) => (
        <div
          key={i}
          className="rounded-2xl bg-surface-elevated border border-line p-4 space-y-3"
        >
          <p className="text-xs font-semibold text-ink-muted uppercase">
            Producto {i + 1}
          </p>
          <div>
            <label
              htmlFor={`prod-name-${i}`}
              className="block text-sm font-medium text-ink-soft mb-1"
            >
              Nombre
            </label>
            <input
              id={`prod-name-${i}`}
              type="text"
              value={prod.nombre}
              onChange={(e) => updateProduct(i, { nombre: e.target.value })}
              className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-base text-ink focus:border-primary-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={`prod-qty-${i}`}
                className="block text-sm font-medium text-ink-soft mb-1"
              >
                Cantidad
              </label>
              <input
                id={`prod-qty-${i}`}
                type="number"
                min={0}
                step={1}
                value={prod.cantidad}
                onChange={(e) =>
                  updateProduct(i, { cantidad: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-base text-ink focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label
                htmlFor={`prod-price-${i}`}
                className="block text-sm font-medium text-ink-soft mb-1"
              >
                Precio unitario
              </label>
              <input
                id={`prod-price-${i}`}
                type="number"
                min={0}
                step={0.5}
                value={prod.precio_unitario ?? ""}
                onChange={(e) =>
                  updateProduct(i, {
                    precio_unitario:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-base text-ink focus:border-primary-500 outline-none"
              />
            </div>
          </div>
          {prod.subtotal != null ? (
            <p className="text-sm text-ink-muted">
              Subtotal:{" "}
              <span className="font-semibold text-ink">
                S/ {prod.subtotal.toFixed(2)}
              </span>
            </p>
          ) : null}
        </div>
      ))}

      <div>
        <span className="block text-sm font-semibold text-ink mb-1.5">
          Método de pago
        </span>
        <div className="grid grid-cols-3 gap-2">
          {paymentOptions.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPayment(m)}
              className={`rounded-lg py-2.5 px-2 text-sm font-medium min-h-[44px] transition-colors ${
                draft.metodo_pago === m
                  ? "bg-primary-600 text-white"
                  : "bg-surface-elevated border border-line text-ink-soft hover:bg-surface-alt"
              }`}
            >
              {paymentLabels[m]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="op-client"
          className="block text-sm font-semibold text-ink mb-1.5"
        >
          Cliente
        </label>
        <input
          id="op-client"
          type="text"
          value={draft.cliente ?? ""}
          placeholder="Opcional"
          onChange={(e) =>
            onChange({
              ...draft,
              cliente: e.target.value === "" ? null : e.target.value,
            })
          }
          className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:border-primary-500 outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="op-registrant"
          className="block text-sm font-semibold text-ink mb-1.5"
        >
          Registrado por
        </label>
        <input
          id="op-registrant"
          type="text"
          value={draft.registrado_por ?? ""}
          onChange={(e) =>
            onChange({
              ...draft,
              registrado_por:
                e.target.value === "" ? null : e.target.value,
            })
          }
          className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink focus:border-primary-500 outline-none"
        />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-primary-50 border border-primary-200 px-4 py-3">
        <span className="text-base font-semibold text-ink">Total</span>
        <span className="text-xl font-bold text-primary-700 tabular-nums">
          S/ {(draft.monto_total ?? 0).toFixed(2)}
        </span>
      </div>

      <Button fullWidth size="lg" onClick={onBack}>
        Volver a confirmar
      </Button>
    </div>
  );
}
