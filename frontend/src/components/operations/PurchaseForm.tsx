import { useState } from "react";
import { Package } from "lucide-react";
import { Button } from "../common/Button";
import { useApp } from "../../context/AppContext";
import { registrarCompraMercaderia } from "../../services/api";
import type { PaymentMethod } from "../../types/operation";

interface PurchaseFormProps {
  onDone: () => void;
}

const methods: PaymentMethod[] = ["efectivo", "yape", "plin", "transferencia"];
const methodLabels: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  fiado: "Fiado",
  mixto: "Mixto",
};

export function PurchaseForm({ onDone }: PurchaseFormProps) {
  const {
    products,
    activePerson,
    refreshInventory,
    refreshCaja,
    refreshSummary,
    refreshOperations,
  } = useApp();
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [montoTotal, setMontoTotal] = useState("");
  const [metodo, setMetodo] = useState<PaymentMethod>("efectivo");
  const [proveedor, setProveedor] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleProduct = (id: number) => {
    setSelected((s) => {
      const next = { ...s };
      if (id in next) delete next[id];
      else next[id] = 1;
      return next;
    });
  };

  const setQty = (id: number, qty: number) => {
    setSelected((s) => ({ ...s, [id]: Math.max(0, qty) }));
  };

  const handleSubmit = async () => {
    const items = Object.entries(selected)
      .filter(([, qty]) => qty > 0)
      .map(([id, cantidad]) => ({ id: Number(id), cantidad }));
    if (items.length === 0) {
      setError("Selecciona al menos un producto.");
      return;
    }
    const total = Number(montoTotal);
    if (!total || total <= 0) {
      setError("Ingresa el monto total de la compra.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registrarCompraMercaderia({
        productos: items,
        monto_total: total,
        metodo_pago: metodo,
        proveedor: proveedor.trim() || null,
        descripcion: descripcion.trim() || null,
        registrado_por: activePerson,
      });
      await Promise.all([
        refreshInventory(),
        refreshCaja(),
        refreshSummary(),
        refreshOperations(),
      ]);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar la compra.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center pt-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-3">
            <Package size={36} className="text-primary-700" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Compra registrada</h1>
          <p className="text-sm text-ink-soft mt-1">
            El inventario y la caja se actualizaron.
          </p>
        </div>
        <Button size="lg" fullWidth onClick={onDone}>
          Registrar otra operación
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Compra de mercadería</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Repón productos y registra el pago.
        </p>
      </div>

      <div>
        <span className="block text-sm font-semibold text-ink mb-1.5">
          Productos a reponer
        </span>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {products.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-3 transition-colors ${
                p.id in selected
                  ? "border-primary-400 bg-primary-50"
                  : "border-line bg-surface-elevated"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => toggleProduct(p.id)}
                  className="flex-1 text-left"
                >
                  <p className="text-sm font-semibold text-ink">{p.nombre}</p>
                  <p className="text-xs text-ink-muted">
                    Stock actual: {p.stock_actual}
                  </p>
                </button>
                {p.id in selected && (
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={selected[p.id]}
                    onChange={(e) => setQty(p.id, Number(e.target.value))}
                    className="w-16 rounded-lg border border-line-strong bg-surface px-2 py-1.5 text-sm text-ink text-center focus:border-primary-500 outline-none"
                    aria-label={`Cantidad de ${p.nombre}`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="pur-total"
          className="block text-sm font-semibold text-ink mb-1.5"
        >
          Monto total
        </label>
        <input
          id="pur-total"
          type="number"
          min={0}
          step={0.5}
          value={montoTotal}
          onChange={(e) => setMontoTotal(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink focus:border-primary-500 outline-none"
        />
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
              {methodLabels[m]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="pur-supplier"
          className="block text-sm font-semibold text-ink mb-1.5"
        >
          Proveedor (opcional)
        </label>
        <input
          id="pur-supplier"
          type="text"
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
          placeholder="Ej: Distribuidora El Sol"
          className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:border-primary-500 outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="pur-desc"
          className="block text-sm font-semibold text-ink mb-1.5"
        >
          Descripción (opcional)
        </label>
        <textarea
          id="pur-desc"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:border-primary-500 outline-none resize-none"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button size="lg" fullWidth onClick={handleSubmit} disabled={loading}>
        {loading ? "Guardando..." : "Registrar compra"}
      </Button>
    </div>
  );
}
