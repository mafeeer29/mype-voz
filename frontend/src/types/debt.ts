export interface Debt {
  id: number;
  nombre: string;
  saldo: number;
  ultimaOperacion: string;
}

export interface PaymentRecord {
  clienteId: number;
  clienteNombre: string;
  monto: number;
  metodo: string;
  fecha: string;
}
