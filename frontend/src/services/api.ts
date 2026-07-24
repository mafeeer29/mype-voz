import type { InterpretedOperation } from "../types/operation";

// Cuando el backend (FastAPI) esté conectado, estas funciones
// realizarán llamadas reales a la API. Por ahora lanzan un error
// para indicar que los datos simulados deben usarse en su lugar.

const API_URL = "http://127.0.0.1:8000/api";

// Futuro endpoint: POST /api/operations/interpret
export async function interpretOperation(
  _text: string,
  _registeredBy?: string,
): Promise<InterpretedOperation> {
  throw new Error("Backend todavía no conectado");
}

// Futuro endpoint: POST /api/operations/confirm
export async function confirmOperation(
  _operation: InterpretedOperation,
): Promise<void> {
  throw new Error("Backend todavía no conectado");
}

export async function checkBackendHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) {
    throw new Error("No se pudo conectar con el backend");
  }
  return response.json();
}
