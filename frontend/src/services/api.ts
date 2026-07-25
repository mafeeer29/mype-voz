import type { InterpretedOperation } from "../types/operation";

// Cuando el backend (FastAPI) esté conectado, estas funciones
// realizarán llamadas reales a la API. Por ahora lanzan un error
// para indicar que los datos simulados deben usarse en su lugar.

const API_URL = "http://127.0.0.1:8000";

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    },
  );

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


export type InventoryProduct = {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock_actual: number;
  stock_minimo: number;
  estado:
    | "disponible"
    | "stock_bajo"
    | "agotado";
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


export async function obtenerInventario() {
  return request<InventoryProduct[]>(
    "/api/inventario",
  );
}


export async function obtenerDeudas() {
  return request<Debt[]>(
    "/api/deudas",
  );
}


export async function obtenerResumen() {
  return request<BusinessSummary>(
    "/api/resumen",
  );
}


export async function obtenerCaja() {
  return request<Record<string, number>>(
    "/api/caja",
  );
}


export async function obtenerOperaciones() {
  return request<Operation[]>(
    "/api/operaciones",
  );
}


export async function consultarNegocio(
  pregunta: string,
) {
  return request<{
    respuesta: string;
    tipo_consulta: string;
  }>(
    "/api/consultar",
    {
      method: "POST",
      body: JSON.stringify({
        pregunta,
      }),
    },
  );
}