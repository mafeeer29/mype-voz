import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { REGISTRANTS, type Registrant } from "../config/appConfig";
import { mockProducts, mockDebts, mockDailySummary } from "../data/mockData";
import type { Product } from "../types/inventory";
import type { Debt } from "../types/debt";
import type { DailySummary } from "../types/summary";
import type {
  InterpretedOperation,
  OperationEffect,
} from "../types/operation";

interface AppContextValue {
  activePerson: Registrant;
  setActivePerson: (p: Registrant) => void;
  registrants: readonly Registrant[];

  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;

  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;

  summary: DailySummary;
  setSummary: React.Dispatch<React.SetStateAction<DailySummary>>;

  lastResult: OperationResultState | null;
  setLastResult: (r: OperationResultState | null) => void;

  applyConfirmedOperation: (op: InterpretedOperation) => void;
}

export interface OperationResultState {
  mensaje: string;
  efectos: OperationEffect[];
  alertas: string[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activePerson, setActivePerson] = useState<Registrant>(REGISTRANTS[0]);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [debts, setDebts] = useState<Debt[]>(mockDebts);
  const [summary, setSummary] = useState<DailySummary>(mockDailySummary);
  const [lastResult, setLastResult] = useState<OperationResultState | null>(
    null,
  );

  const applyConfirmedOperation = useCallback(
    (op: InterpretedOperation) => {
      const efectos: OperationEffect[] = [];
      const alertas: string[] = [];

      if (op.metodo_pago && op.monto_pagado > 0) {
        const caja =
          op.metodo_pago === "efectivo"
            ? "Caja efectivo"
            : `Caja ${op.metodo_pago.charAt(0).toUpperCase()}${op.metodo_pago.slice(1)}`;
        efectos.push({
          descripcion: caja,
          detalle: `+S/ ${op.monto_pagado.toFixed(2)}`,
        });
      }

      if (op.monto_fiado > 0 && op.cliente) {
        efectos.push({
          descripcion: `Deuda de ${op.cliente}`,
          detalle: `+S/ ${op.monto_fiado.toFixed(2)}`,
        });
      }

      const updatedProducts = [...products];
      for (const prod of op.productos) {
        const idx = updatedProducts.findIndex(
          (p) => p.nombre.toLowerCase() === prod.nombre.toLowerCase(),
        );
        if (idx !== -1) {
          const prev = updatedProducts[idx].stock_actual;
          const next = Math.max(0, prev - prod.cantidad);
          updatedProducts[idx] = {
            ...updatedProducts[idx],
            stock_actual: next,
            estado:
              next === 0
                ? "agotado"
                : next < updatedProducts[idx].stock_minimo
                  ? "stock_bajo"
                  : "disponible",
          };
          efectos.push({
            descripcion: `Stock de ${updatedProducts[idx].nombre.toLowerCase()}`,
            detalle: `${prev} → ${next}`,
          });
          if (
            next < updatedProducts[idx].stock_minimo &&
            next > 0
          ) {
            alertas.push(
              `Stock bajo: quedan ${next} ${updatedProducts[idx].nombre.toLowerCase()}. El stock mínimo es ${updatedProducts[idx].stock_minimo}.`,
            );
          } else if (next === 0) {
            alertas.push(
              `${updatedProducts[idx].nombre} se agotó.`,
            );
          }
        }
      }
      setProducts(updatedProducts);

      const stockBajoCount = updatedProducts.filter(
        (p) => p.estado === "stock_bajo" || p.estado === "agotado",
      ).length;

      setSummary((s) => ({
        ...s,
        ventasTotales:
          op.tipo_operacion === "venta" || op.tipo_operacion === "venta_fiada"
            ? s.ventasTotales + (op.monto_total ?? 0)
            : s.ventasTotales,
        gastos:
          op.tipo_operacion === "gasto" ||
          op.tipo_operacion === "compra_mercaderia"
            ? s.gastos + (op.monto_total ?? 0)
            : s.gastos,
        dineroRecibido:
          op.tipo_operacion === "venta"
            ? s.dineroRecibido + op.monto_pagado
            : s.dineroRecibido,
        montoFiado:
          op.monto_fiado > 0
            ? s.montoFiado + op.monto_fiado
            : s.montoFiado,
        efectivoEsperado:
          op.metodo_pago === "efectivo" && op.tipo_operacion === "venta"
            ? s.efectivoEsperado + op.monto_pagado
            : s.efectivoEsperado,
        productosStockBajo: stockBajoCount,
      }));

      setLastResult({
        mensaje: "Venta registrada correctamente",
        efectos,
        alertas,
      });
    },
    [products, setProducts, setSummary],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      activePerson,
      setActivePerson,
      registrants: REGISTRANTS,
      products,
      setProducts,
      debts,
      setDebts,
      summary,
      setSummary,
      lastResult,
      setLastResult,
      applyConfirmedOperation,
    }),
    [
      activePerson,
      products,
      debts,
      summary,
      lastResult,
      applyConfirmedOperation,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}
