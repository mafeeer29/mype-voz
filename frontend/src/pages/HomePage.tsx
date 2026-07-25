import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  TrendingUp,
  Wallet,
  Banknote,
  HandCoins,
  Coins,
  AlertTriangle,
} from "lucide-react";

import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/common/Button";
import { MetricCard } from "../components/dashboard/MetricCard";
import { DailySummaryCard } from "../components/dashboard/DailySummaryCard";
import { useApp } from "../context/AppContext";
import { APP_CONFIG } from "../config/appConfig";
import { formatSoles } from "../utils/currency";
import {
  obtenerResumen,
  type BusinessSummary,
} from "../services/api";


const today = new Date().toLocaleDateString("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});


export function HomePage() {
  const {
    summary,
    activePerson,
    setActivePerson,
    registrants,
    products,
  } = useApp();

  const navigate = useNavigate();

  const [backendSummary, setBackendSummary] =
    useState<BusinessSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // --------------------------------
  // Cargar resumen real desde FastAPI
  // --------------------------------

  useEffect(() => {
    async function cargarResumen() {
      try {
        setLoading(true);
        setError("");

        const data = await obtenerResumen();

        setBackendSummary(data);
      } catch (error) {
        console.error(
          "No se pudo cargar el resumen:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "No se pudo conectar con el backend.",
        );
      } finally {
        setLoading(false);
      }
    }

    cargarResumen();
  }, []);


  // Adaptar los nombres del backend al formato que
  // ya utiliza el frontend.
  const dashboardSummary = {
    ...summary,

    ventasTotales:
      backendSummary?.ventas_totales
      ?? summary.ventasTotales,

    gastos:
      backendSummary?.gastos_totales
      ?? summary.gastos,

    dineroRecibido:
      backendSummary?.pagos_deuda_recibidos
      ?? summary.dineroRecibido,

    montoFiado:
      backendSummary?.deudas_pendientes
      ?? summary.montoFiado,

    efectivoEsperado:
      backendSummary?.total_caja
      ?? summary.efectivoEsperado,
  };


  // Si el resumen ya llegó del backend, usamos sus
  // cantidades. Si no, conservamos el cálculo local.
  const lowOrOut = backendSummary
    ? (
        backendSummary.productos_stock_bajo
        + backendSummary.productos_agotados
      )
    : products.filter(
        (product) =>
          product.estado === "stock_bajo"
          || product.estado === "agotado",
      ).length;


  return (
    <PageContainer>
      <div className="space-y-5">
        <div>
          <p className="text-sm text-ink-muted capitalize">
            {today}
          </p>

          <h1 className="text-2xl font-bold text-ink mt-0.5">
            Hola, {activePerson}
          </h1>

          <p className="text-sm text-ink-soft">
            {APP_CONFIG.businessName}
          </p>
        </div>


        <div>
          <label
            htmlFor="active-person"
            className="
              block text-sm font-semibold
              text-ink mb-1.5
            "
          >
            Persona activa
          </label>

          <select
            id="active-person"
            value={activePerson}
            onChange={(event) =>
              setActivePerson(
                event.target.value as typeof activePerson,
              )
            }
            className="
              w-full rounded-xl
              border border-line-strong
              bg-surface-elevated
              px-4 py-3
              text-base text-ink
              focus:border-primary-500
              outline-none
            "
          >
            {registrants.map((registrant) => (
              <option
                key={registrant}
                value={registrant}
              >
                {registrant}
              </option>
            ))}
          </select>
        </div>


        {loading && (
          <div
            className="
              rounded-xl border border-line
              bg-surface-elevated p-4
            "
          >
            <p className="text-sm text-ink-soft">
              Cargando resumen del negocio...
            </p>
          </div>
        )}


        {error && (
          <div
            className="
              rounded-xl border border-red-200
              bg-red-50 p-4
            "
          >
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}


        {!loading && (
          <>
            <DailySummaryCard
              summary={dashboardSummary}
            />

            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Ventas totales"
                value={formatSoles(
                  dashboardSummary.ventasTotales,
                )}
                icon={<TrendingUp size={18} />}
                tone="positive"
              />

              <MetricCard
                label="Gastos"
                value={formatSoles(
                  dashboardSummary.gastos,
                )}
                icon={<Wallet size={18} />}
                tone="negative"
              />

              <MetricCard
                label="Pagos de deuda"
                value={formatSoles(
                  dashboardSummary.dineroRecibido,
                )}
                icon={<Banknote size={18} />}
                tone="positive"
              />

              <MetricCard
                label="Deudas pendientes"
                value={formatSoles(
                  dashboardSummary.montoFiado,
                )}
                icon={<HandCoins size={18} />}
                tone="warning"
              />

              <MetricCard
                label="Total en caja"
                value={formatSoles(
                  dashboardSummary.efectivoEsperado,
                )}
                icon={<Coins size={18} />}
              />

              <MetricCard
                label="Stock bajo o agotado"
                value={lowOrOut}
                icon={<AlertTriangle size={18} />}
                tone={
                  lowOrOut > 0
                    ? "warning"
                    : "default"
                }
              />
            </div>
          </>
        )}


        <Button
          size="lg"
          fullWidth
          onClick={() => navigate("/registrar")}
        >
          <PlusCircle size={22} />
          Registrar operación
        </Button>
      </div>
    </PageContainer>
  );
}