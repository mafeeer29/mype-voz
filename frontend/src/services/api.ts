// Servicio centralizado de solicitudes HTTP al backend FastAPI.
// Todas las llamadas del frontend deben pasar por aquí.

import type { InterpretedOperation } from "../types/operation";

const API_URL = "http://127.0.0.1:8000";

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let message = `Error del servidor: ${response.status}`;

    try {
      const errorData = await response.json();

      if (errorData.detail) {
        message = errorData.detail;
      }
    } catch {
      // Se conserva el mensaje general.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// -----------------------------
// Tipos de respuesta del backend
// -----------------------------

export type InventoryProduct = {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock_actual: number;
  stock_minimo: number;
  estado: "disponible" | "stock_bajo" | "agotado";
};

export type Debt = {
  id: number;
  cliente: string;
  monto_original: number;
  saldo_pendiente: number;
  estado: string;
};

export type BusinessSummary = {
  ventas_totales: number;
  gastos_totales: number;
  compras_mercaderia: number;
  pagos_deuda_recibidos: number;
  deudas_pendientes: number;
  productos_stock_bajo: number;
  productos_agotados: number;
  total_caja: number;
  caja_por_metodo: Record<string, number>;
};

export type Operation = {
  id: number;
  tipo_operacion: string;
  monto: number;
  metodo_pago: string | null;
  cliente: string | null;
  categoria: string | null;
  descripcion: string | null;
  registrado_por: string | null;
  fecha: string;
};

export type PaymentMethod =
  | "efectivo"
  | "yape"
  | "plin"
  | "tarjeta"
  | "transferencia"
  | "fiado"
  | "mixto";

export type InterpretResponse = {
  operacion: InterpretedOperation;
  requiere_confirmacion: boolean;
};

export type InventoryEffect = {
  producto: string;
  stock_anterior: number;
  stock_actual: number;
  stock_minimo: number;
  estado: "disponible" | "stock_bajo" | "agotado";
};

export type CashEffect = {
  metodo: string;
  saldo_anterior: number;
  monto_agregado: number;
  saldo_actual: number;
};

export type DebtEffect = {
  cliente: string;
  saldo_anterior: number;
  monto_agregado: number;
  saldo_actual: number;
};

export type ConfirmOperationResponse = {
  mensaje: string;
  inventario: InventoryEffect[];
  caja: CashEffect | null;
  deuda: DebtEffect | null;
  alertas: string[];
};

export type DebtPaymentResponse = {
  mensaje: string;
  deuda_id: number;
  cliente: string;
  saldo_anterior: number;
  monto_pagado: number;
  saldo_actual: number;
  estado: string;
  caja: CashEffect;
};

export type ExpenseResponse = {
  mensaje: string;
  categoria: string;
  descripcion: string | null;
  monto: number;
  metodo_pago: string;
  saldo_anterior: number;
  saldo_actual: number;
};

export type InventoryIncreaseEffect = {
  producto: string;
  stock_anterior: number;
  cantidad_agregada: number;
  stock_actual: number;
  stock_minimo: number;
  estado: "disponible" | "stock_bajo" | "agotado";
};

export type MerchandisePurchaseResponse = {
  mensaje: string;
  inventario: InventoryIncreaseEffect[];
  metodo_pago: string;
  monto_pagado: number;
  saldo_anterior: number;
  saldo_actual: number;
};

export type NaturalQueryResponse = {
  respuesta: string;
  tipo_consulta: string;
};

// -----------------------------
// GET
// -----------------------------

export async function verificarSalud() {
  return request<{ status: string; message?: string }>("/api/health");
}

export async function obtenerInventario() {
  return request<InventoryProduct[]>("/api/inventario");
}

export async function obtenerCaja() {
  return request<Record<string, number>>("/api/caja");
}

export async function obtenerDeudas() {
  return request<Debt[]>("/api/deudas");
}

export async function obtenerOperaciones() {
  return request<Operation[]>("/api/operaciones");
}

export async function obtenerResumen() {
  return request<BusinessSummary>("/api/resumen");
}

// -----------------------------
// POST
// -----------------------------

export async function interpretarOperacion(
  texto: string,
  registradoPor?: string,
) {
  return request<InterpretResponse>("/api/interpretar", {
    method: "POST",
    body: JSON.stringify({
      texto,
      registrado_por: registradoPor ?? null,
    }),
  });
}

export async function confirmarOperacion(operacion: InterpretedOperation) {
  return request<ConfirmOperationResponse>(
    "/api/operaciones/confirmar",
    {
      method: "POST",
      body: JSON.stringify(operacion),
    },
  );
}

export async function pagarDeuda(
  deudaId: number,
  monto: number,
  metodoPago: PaymentMethod,
  registradoPor?: string,
) {
  return request<DebtPaymentResponse>(
    `/api/deudas/${deudaId}/pagar`,
    {
      method: "POST",
      body: JSON.stringify({
        monto,
        metodo_pago: metodoPago,
        registrado_por: registradoPor ?? null,
      }),
    },
  );
}

export async function registrarGasto(payload: {
  monto: number;
  categoria: string;
  metodo_pago: PaymentMethod;
  descripcion?: string | null;
  registrado_por?: string | null;
}) {
  return request<ExpenseResponse>("/api/gastos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registrarCompraMercaderia(payload: {
  productos: { id: number; cantidad: number }[];
  monto_total: number;
  metodo_pago: PaymentMethod;
  proveedor?: string | null;
  descripcion?: string | null;
  registrado_por?: string | null;
}) {
  return request<MerchandisePurchaseResponse>(
    "/api/compras-mercaderia",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function consultarNegocio(pregunta: string) {
  return request<NaturalQueryResponse>("/api/consultar", {
    method: "POST",
    body: JSON.stringify({ pregunta }),
  });
}
