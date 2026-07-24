import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "../common/Button";
import { useApp } from "../../context/AppContext";

interface OperationSuccessProps {
  onRegisterAnother: () => void;
  onGoHome: () => void;
}

export function OperationSuccess({
  onRegisterAnother,
  onGoHome,
}: OperationSuccessProps) {
  const { lastResult } = useApp();

  if (!lastResult) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col items-center text-center pt-6">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-3">
          <CheckCircle2 size={36} className="text-primary-700" />
        </div>
        <h1 className="text-2xl font-bold text-ink">{lastResult.mensaje}</h1>
      </div>

      {lastResult.efectos.length > 0 ? (
        <div className="rounded-2xl bg-surface-elevated border border-line shadow-sm p-5">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
            Efectos simulados
          </p>
          <ul className="space-y-2.5">
            {lastResult.efectos.map((ef, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-ink-soft flex items-center gap-2">
                  <ArrowRight size={16} className="text-primary-600" />
                  {ef.descripcion}
                </span>
                <span className="font-semibold text-ink tabular-nums">
                  {ef.detalle}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {lastResult.alertas.length > 0 ? (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-700" />
            <p className="text-sm font-semibold text-amber-800">Stock bajo</p>
          </div>
          {lastResult.alertas.map((a, i) => (
            <p key={i} className="text-sm text-amber-800 leading-relaxed">
              {a}
            </p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button size="lg" fullWidth onClick={onRegisterAnother}>
          Registrar otra operación
        </Button>
        <Button variant="outline" size="lg" fullWidth onClick={onGoHome}>
          Ver inicio
        </Button>
      </div>
    </div>
  );
}
