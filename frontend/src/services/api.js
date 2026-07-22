const API_URL = "http://127.0.0.1:8000/api";

export async function checkBackendHealth() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error("No se pudo conectar con el backend");
  }

  return response.json();
}