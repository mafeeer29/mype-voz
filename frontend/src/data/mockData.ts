import type { DailySummary } from "../types/summary";
import type { Product } from "../types/inventory";
import type { Debt } from "../types/debt";
import type { InterpretedOperation } from "../types/operation";

export const mockDailySummary: DailySummary = {
  ventasTotales: 180,
  gastos: 40,
  dineroRecibido: 145,
  montoFiado: 35,
  efectivoEsperado: 72,
  productosStockBajo: 1,
};

export const mockProducts: Product[] = [
  {
    id: 1,
    nombre: "Gaseosa personal",
    categoria: "Bebidas",
    stock_actual: 5,
    stock_minimo: 6,
    precio: 4,
    estado: "stock_bajo",
  },
  {
    id: 2,
    nombre: "Aceite",
    categoria: "Abarrotes",
    stock_actual: 12,
    stock_minimo: 5,
    precio: 10,
    estado: "disponible",
  },
  {
    id: 3,
    nombre: "Leche",
    categoria: "Lácteos",
    stock_actual: 0,
    stock_minimo: 4,
    precio: 4.5,
    estado: "agotado",
  },
];

export const mockDebts: Debt[] = [
  {
    id: 1,
    cliente: "Rosa",
    monto_original: 20,
    saldo_pendiente: 20,
    estado: "pendiente",
  },
  {
    id: 2,
    cliente: "Carlos",
    monto_original: 15,
    saldo_pendiente: 15,
    estado: "pendiente",
  },
  {
    id: 3,
    cliente: "María",
    monto_original: 8,
    saldo_pendiente: 8,
    estado: "pendiente",
  },
];

export const mockInterpretedOperation: InterpretedOperation = {
  tipo_operacion: "venta",
  productos: [
    {
      id: null,
      nombre: "Gaseosa personal",
      cantidad: 3,
      precio_unitario: 4,
      subtotal: 12,
    },
  ],
  monto_total: 12,
  metodo_pago: "yape",
  cliente: null,
  categoria_gasto: null,
  monto_pagado: 12,
  monto_fiado: 0,
  registrado_por: "Rosa",
  campos_faltantes: [],
  advertencias: [],
};

export const examplePhrases = [
  "Vendí tres gaseosas a cuatro soles y me pagaron por Yape.",
  "Compré dos kilos de azúcar por diez soles.",
  "Doña Rosa me debe quince soles de ayer.",
  "Gasté treinta soles en transporte hoy.",
];
