export type ProductStatus = "disponible" | "stock_bajo" | "agotado";

export interface Product {
  id: number;
  nombre: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  precio: number;
  estado: ProductStatus;
}

export type InventoryFilter = "todos" | "disponible" | "stock_bajo" | "agotado";
