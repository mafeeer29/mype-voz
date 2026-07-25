import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Wallet, Package } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { OperationForm } from "../components/operations/OperationForm";
import { OperationConfirmation } from "../components/operations/OperationConfirmation";
import { OperationSuccess } from "../components/operations/OperationSuccess";
import { ExpenseForm } from "../components/operations/ExpenseForm";
import { PurchaseForm } from "../components/operations/PurchaseForm";
import { useApp } from "../context/AppContext";
import { confirmarOperacion } from "../services/api";
import type { InterpretedOperation } from "../types/operation";

type Stage = "form" | "confirm" | "success";
type Mode = "natural" | "gasto" | "compra";

const modes: { key: Mode; label: string; icon: typeof Sparkles }[] = [
  { key: "natural", label: "Natural", icon: Sparkles },
  { key: "gasto", label: "Gasto", icon: Wallet },
  { key: "compra", label: "Compra", icon: Package },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { setLastResult, refreshAll } = useApp();
  const [mode, setMode] = useState<Mode>("natural");
  const [stage, setStage] = useState<Stage>("form");
  const [operation, setOperation] = useState<InterpretedOperation | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleInterpreted = (op: InterpretedOperation) => {
    setOperation(op);
    setStage("confirm");
  };

  const handleCancel = () => {
    setOperation(null);
    setStage("form");
  };

  const handleConfirm = async (op: InterpretedOperation) => {
    setConfirming(true);
    setConfirmError(null);
    try {
      const res = await confirmarOperacion(op);
      const efectos = [
        ...res.inventario.map((inv) => ({
          descripcion: `Stock de ${inv.producto.toLowerCase()}`,
          detalle: `${inv.stock_anterior} → ${inv.stock_actual}`,
        })),
        ...(res.caja
          ? [
              {
                descripcion: `Caja ${res.caja.metodo}`,
                detalle: `+S/ ${res.caja.monto_agregado.toFixed(2)}`,
              },
            ]
          : []),
        ...(res.deuda
          ? [
              {
                descripcion: `Deuda de ${res.deuda.cliente}`,
                detalle: `+S/ ${res.deuda.monto_agregado.toFixed(2)}`,
              },
            ]
          : []),
      ];
      setLastResult({
        mensaje: res.mensaje,
        efectos,
        alertas: res.alertas,
      });
      await refreshAll();
      setStage("success");
    } catch (err) {
      setConfirmError(
        err instanceof Error
          ? err.message
          : "No se pudo confirmar la operación.",
      );
    } finally {
      setConfirming(false);
    }
  };

  const handleRegisterAnother = () => {
    setLastResult(null);
    setOperation(null);
    setConfirmError(null);
    setStage("form");
  };

  const handleFormDone = () => {
    setStage("form");
  };

  return (
    <PageContainer>
      {stage === "success" ? (
        <OperationSuccess
          onRegisterAnother={handleRegisterAnother}
          onGoHome={() => navigate("/")}
        />
      ) : stage === "confirm" && operation ? (
        <>
          {confirmError && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{confirmError}</p>
            </div>
          )}
          <OperationConfirmation
            operation={operation}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
            confirming={confirming}
          />
        </>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {modes.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 min-h-[56px] transition-colors ${
                  mode === key
                    ? "bg-primary-600 text-white"
                    : "bg-surface-elevated border border-line text-ink-soft hover:bg-surface-alt"
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>

          {mode === "natural" ? (
            <OperationForm onInterpreted={handleInterpreted} />
          ) : mode === "gasto" ? (
            <ExpenseForm onDone={handleFormDone} />
          ) : (
            <PurchaseForm onDone={handleFormDone} />
          )}
        </div>
      )}
    </PageContainer>
  );
}
