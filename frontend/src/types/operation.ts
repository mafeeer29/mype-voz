export type PaymentMethod =
  | "efectivo"
  | "yape"
  | "plin"
  | "tarjeta"
  | "transferencia"
  | "fiado"
  | "mixto";

export type OperationType =
  | "venta"
  | "gasto"
  | "venta_fiada"
  | "compra_mercaderia"
  | "pago_deuda";

export interface InterpretedProduct {
  id?: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number | null;
  subtotal: number | null;
}

export interface InterpretedOperation {
  tipo_operacion: OperationType;
  productos: InterpretedProduct[];
  monto_total: number | null;
  metodo_pago: PaymentMethod | null;
  cliente: string | null;
  categoria_gasto: string | null;
  monto_pagado: number;
  monto_fiado: number;
  registrado_por: string | null;
  campos_faltantes: string[];
  advertencias: string[];
}

export interface OperationEffect {
  descripcion: string;
  detalle: string;
}

export interface OperationResult {
  mensaje: string;
  efectos: OperationEffect[];
  alertas: string[];
}
