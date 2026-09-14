import { ApiError, request } from "../../../lib/api/client";
import type { Autorizacion, ResumenTarjeta, Tarjeta } from "../types/tarjetas.types";

export type { Autorizacion, ResumenTarjeta, Tarjeta } from "../types/tarjetas.types";

export function listarTarjetas(personaId: string) {
  return request<Tarjeta[]>(`/personas/${personaId}/tarjetas`);
}

export function emitirTarjeta(payload: {
  persona_id: string;
  tipo: "debito" | "credito";
  cuenta_id?: string | null;
  limite?: number | null;
}) {
  return request<Tarjeta>("/tarjetas", { method: "POST", body: JSON.stringify(payload) });
}

export function cambiarEstadoTarjeta(tarjetaId: string, accion: "bloquear" | "desbloquear") {
  return request<Tarjeta>(`/tarjetas/${tarjetaId}/bloqueo`, {
    method: "POST",
    body: JSON.stringify({ accion }),
  });
}

export function obtenerResumenTarjeta(tarjetaId: string, periodo?: string) {
  const query = periodo ? `?periodo=${periodo}` : "";
  return request<ResumenTarjeta>(`/tarjetas/${tarjetaId}/resumen${query}`);
}

/**
 * Autoriza un consumo. Un rechazo por saldo o límite NO es un error: el backend
 * lo registra y responde 422 con la autorización y su motivo. Acá se devuelve
 * como resultado normal para que la pantalla muestre el motivo, no un error genérico.
 */
export async function autorizarConsumo(
  tarjetaId: string,
  payload: { comercio: string; monto: number; cuotas?: number },
  idempotencyKey: string
): Promise<Autorizacion> {
  try {
    return await request<Autorizacion>(`/tarjetas/${tarjetaId}/autorizaciones`, {
      method: "POST",
      body: JSON.stringify(payload),
      idempotencyKey,
    });
  } catch (error) {
    const payload = error instanceof ApiError ? (error.payload as Partial<Autorizacion> | null) : null;
    if (error instanceof ApiError && error.status === 422 && payload?.estado === "rechazada") {
      return payload as Autorizacion;
    }
    throw error;
  }
}
