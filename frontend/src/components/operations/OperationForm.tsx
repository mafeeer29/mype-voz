import { useState } from "react";
import { Mic, Sparkles, ShoppingCart, Wallet, HandCoins } from "lucide-react";
import { Button } from "../common/Button";
import { useApp } from "../../context/AppContext";
import { examplePhrases } from "../../data/mockData";
import { mockInterpretedOperation } from "../../data/mockData";
import type { InterpretedOperation, OperationType } from "../../types/operation";

interface OperationFormProps {
  onInterpreted: (op: InterpretedOperation) => void;
}

const quickTypes: {
  key: OperationType;
  label: string;
  icon: typeof ShoppingCart;
}[] = [
  { key: "venta", label: "Venta", icon: ShoppingCart },
  { key: "gasto", label: "Gasto", icon: Wallet },
  { key: "venta_fiada", label: "Fiado", icon: HandCoins },
];

export function OperationForm({ onInterpreted }: OperationFormProps) {
  const { activePerson, setActivePerson, registrants } = useApp();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const handleInterpret = () => {
    if (!text.trim()) {
      setError("Escribe o dicta qué quieres registrar.");
      return;
    }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onInterpreted({
        ...mockInterpretedOperation,
        registrado_por: activePerson,
      });
    }, 900);
  };

  const toggleMic = () => {
    setRecording((r) => !r);
    if (!recording) {
      setTimeout(() => setRecording(false), 1800);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">¿Qué deseas registrar?</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Cuéntalo en tus palabras. Nosotros lo organizamos por ti.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {quickTypes.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-elevated border border-line py-3 px-2 min-h-[56px] hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <Icon size={20} className="text-primary-700" aria-hidden="true" />
            <span className="text-xs font-semibold text-ink-soft">{label}</span>
          </button>
        ))}
      </div>

      <div>
        <label
          htmlFor="operation-text"
          className="block text-sm font-semibold text-ink mb-1.5"
        >
          Tu frase
        </label>
        <textarea
          id="operation-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ejemplo: Vendí tres gaseosas a cuatro soles y me pagaron por Yape."
          rows={4}
          className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none resize-none"
        />
        {error ? (
          <p className="mt-2 text-sm text-error-600 font-medium" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMic}
          className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            recording
              ? "bg-error-500 text-white animate-pulse-soft"
              : "bg-surface-elevated border border-line-strong text-primary-700 hover:bg-primary-50"
          }`}
          aria-label={recording ? "Detener grabación" : "Grabar con el micrófono"}
        >
          <Mic size={22} />
        </button>
        <Button
          size="lg"
          fullWidth
          onClick={handleInterpret}
          disabled={loading}
        >
          {loading ? (
            <>
              <Sparkles size={20} className="animate-spin" />
              Estoy revisando la operación...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Interpretar
            </>
          )}
        </Button>
      </div>

      <div>
        <label
          htmlFor="registered-by"
          className="block text-sm font-semibold text-ink mb-1.5"
        >
          Registrado por
        </label>
        <select
          id="registered-by"
          value={activePerson}
          onChange={(e) => setActivePerson(e.target.value as typeof activePerson)}
          className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
        >
          {registrants.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl bg-surface-alt border border-line p-4">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
          Ejemplos
        </p>
        <ul className="space-y-2">
          {examplePhrases.map((phrase, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setText(phrase)}
                className="text-left text-sm text-ink-soft hover:text-primary-700 w-full"
              >
                “{phrase}”
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
