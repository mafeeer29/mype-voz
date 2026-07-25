import { useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "../common/Button";
import { useApp } from "../../context/AppContext";
import { registrarGasto } from "../../services/api";
import type { PaymentMethod } from "../../types/operation";

interface ExpenseFormProps {
  onDone: () => void;
}

const categories = [
  "Alquiler",
  "Servicios",
  "Transporte",
  "Suministros",
  "Salarios",
  "Otros",
];

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

export function ExpenseForm({ onDone }: ExpenseFormProps) {
  const { activePerson, refreshCaja, refreshSummary, refreshOperations } =
    useApp();
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState(categories[0]);
  const [metodo, setMetodo] = useState<PaymentMethod>("efectivo");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    const n = Number(monto);
    if (!n || n <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registrarGasto({
        monto: n,
        categoria,
        metodo_pago: metodo,
        descripcion: descripcion.trim() || null,
        registrado_por: activePerson,
      });
      await Promise.all([refreshCaja(), refreshSummary(), refreshOperations()]);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo registrar el gasto.",
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
            <Wallet size={36} className="text-primary-700" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Gasto registrado</h1>
          <p className="text-sm text-ink-soft mt-1">
            Se descontó de la caja correctamente.
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
        <h1 className="text-2xl font-bold text-ink">Registrar gasto</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Anota un gasto del negocio.
        </p>
      </div>

      <div>
        <label
          htmlFor="exp-amount"
          className="block text-sm font-semibold text-ink mb-1.5"
        >
          Monto
        </label>
        <input
          id="exp-amount"
          type="number"
          min={0}
          step={0.5}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink focus:border-primary-500 outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="exp-cat"
          className="block text-sm font-semibold text-ink mb-1.5"
        >
          Categoría
        </label>
        <select
          id="exp-cat"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink focus:border-primary-500 outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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
          htmlFor="exp-desc"
          className="block text-sm font-semibold text-ink mb-1.5"
        >
          Descripción (opcional)
        </label>
        <textarea
          id="exp-desc"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={2}
          placeholder="Ej: Pago de luz del local"
          className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:border-primary-500 outline-none resize-none"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button size="lg" fullWidth onClick={handleSubmit} disabled={loading}>
        {loading ? "Guardando..." : "Registrar gasto"}
      </Button>
    </div>
  );
}
