import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/common/EmptyState";
import { Button } from "../components/common/Button";
import { useApp } from "../context/AppContext";
import { formatSoles } from "../utils/currency";
import type { Operation } from "../services/api";

const tipoLabels: Record<string, string> = {
  venta: "Venta",
  venta_fiada: "Venta fiada",
  gasto: "Gasto",
  compra_mercaderia: "Compra de mercadería",
  pago_deuda: "Pago de deuda",
};

const tipoTono: Record<string, string> = {
  venta: "bg-primary-500/15 text-primary-700",
  venta_fiada: "bg-secondary-500/15 text-secondary-600",
  gasto: "bg-error-500/15 text-error-600",
  compra_mercaderia: "bg-warning-500/15 text-warning-600",
  pago_deuda: "bg-success-500/15 text-success-600",
};

const metodoLabels: Record<string, string> = {
  efectivo: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  fiado: "Fiado",
  mixto: "Mixto",
};

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryPage() {
  const navigate = useNavigate();
  const { operations, refreshOperations } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarHistorial() {
      try {
        setLoading(true);
        setError("");
        await refreshOperations();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el historial.",
        );
      } finally {
        setLoading(false);
      }
    }
    cargarHistorial();
  }, [refreshOperations]);

  const recientes: Operation[] = [...operations].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );

  return (
    <PageContainer>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Volver al inicio"
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-surface-elevated border border-line text-ink-soft hover:bg-surface-alt transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-ink">Historial</h1>
            <p className="text-sm text-ink-soft">
              Operaciones registradas
            </p>
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border border-line bg-surface-elevated p-4">
            <p className="text-sm text-ink-soft">
              Cargando historial...
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && recientes.length === 0 && (
          <EmptyState
            icon={<History size={32} />}
            title="Sin operaciones"
            description="Aún no se ha registrado ninguna operación."
          />
        )}

        {!loading && !error && recientes.length > 0 && (
          <div className="space-y-3">
            {recientes.map((op) => {
              const tono = tipoTono[op.tipo_operacion] ?? "bg-surface-alt text-ink-soft";
              const tipo = tipoLabels[op.tipo_operacion] ?? op.tipo_operacion;
              const metodo = op.metodo_pago
                ? metodoLabels[op.metodo_pago] ?? op.metodo_pago
                : null;
              return (
                <div
                  key={op.id}
                  className="rounded-2xl bg-surface-elevated border border-line shadow-sm p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tono}`}
                    >
                      {tipo}
                    </span>
                    <span className="text-base font-bold text-ink tabular-nums">
                      {formatSoles(op.monto)}
                    </span>
                  </div>

                  {metodo && (
                    <p className="text-sm text-ink-soft">
                      <span className="text-ink-muted">Método: </span>
                      {metodo}
                    </p>
                  )}

                  {op.cliente && (
                    <p className="text-sm text-ink-soft">
                      <span className="text-ink-muted">Cliente: </span>
                      {op.cliente}
                    </p>
                  )}

                  {op.categoria && (
                    <p className="text-sm text-ink-soft">
                      <span className="text-ink-muted">Categoría: </span>
                      {op.categoria}
                    </p>
                  )}

                  {op.descripcion && (
                    <p className="text-sm text-ink-soft">
                      <span className="text-ink-muted">Detalle: </span>
                      {op.descripcion}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-line">
                    <p className="text-xs text-ink-muted">
                      {formatearFecha(op.fecha)}
                    </p>
                    {op.registrado_por && (
                      <p className="text-xs text-ink-muted">
                        Por {op.registrado_por}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && (
          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate("/")}
          >
            Volver al inicio
          </Button>
        )}
      </div>
    </PageContainer>
  );
}
