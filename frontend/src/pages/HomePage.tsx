import { useNavigate } from "react-router-dom";
import { PlusCircle, TrendingUp, Wallet, Banknote, HandCoins, Coins, AlertTriangle } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/common/Button";
import { MetricCard } from "../components/dashboard/MetricCard";
import { DailySummaryCard } from "../components/dashboard/DailySummaryCard";
import { useApp } from "../context/AppContext";
import { APP_CONFIG } from "../config/appConfig";
import { formatSoles } from "../utils/currency";

const today = new Date().toLocaleDateString("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function HomePage() {
  const { summary, activePerson, setActivePerson, registrants, products } =
    useApp();
  const navigate = useNavigate();

  const lowOrOut = products.filter(
    (p) => p.estado === "stock_bajo" || p.estado === "agotado",
  ).length;

  return (
    <PageContainer>
      <div className="space-y-5">
        <div>
          <p className="text-sm text-ink-muted capitalize">{today}</p>
          <h1 className="text-2xl font-bold text-ink mt-0.5">
            Hola, {activePerson}
          </h1>
          <p className="text-sm text-ink-soft">{APP_CONFIG.businessName}</p>
        </div>

        <div>
          <label
            htmlFor="active-person"
            className="block text-sm font-semibold text-ink mb-1.5"
          >
            Persona activa
          </label>
          <select
            id="active-person"
            value={activePerson}
            onChange={(e) =>
              setActivePerson(e.target.value as typeof activePerson)
            }
            className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink focus:border-primary-500 outline-none"
          >
            {registrants.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <DailySummaryCard summary={summary} />

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Ventas totales"
            value={formatSoles(summary.ventasTotales)}
            icon={<TrendingUp size={18} />}
            tone="positive"
          />
          <MetricCard
            label="Gastos"
            value={formatSoles(summary.gastos)}
            icon={<Wallet size={18} />}
            tone="negative"
          />
          <MetricCard
            label="Dinero recibido"
            value={formatSoles(summary.dineroRecibido)}
            icon={<Banknote size={18} />}
            tone="positive"
          />
          <MetricCard
            label="Monto fiado"
            value={formatSoles(summary.montoFiado)}
            icon={<HandCoins size={18} />}
            tone="warning"
          />
          <MetricCard
            label="Efectivo esperado"
            value={formatSoles(summary.efectivoEsperado)}
            icon={<Coins size={18} />}
          />
          <MetricCard
            label="Stock bajo"
            value={lowOrOut}
            icon={<AlertTriangle size={18} />}
            tone={lowOrOut > 0 ? "warning" : "default"}
          />
        </div>

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
