import { request } from "../../../lib/api/client";
import type { Paginado } from "../../common.types";
import type { PlazoFijo, ResultadoAcreditacion, SimulacionPlazoFijo } from "../types/inversiones.types";

export type * from "../types/inversiones.types";

export function simularPlazoFijo(payload: { capital: number; dias: number; tna?: number | null }) {
  return request<SimulacionPlazoFijo>("/plazos-fijos/simulaciones", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function constituirPlazoFijo(
  payload: { cuenta_id: string; capital: number; dias: number; tna?: number | null },
  idempotencyKey: string
) {
  return request<PlazoFijo>("/plazos-fijos", { method: "POST", body: JSON.stringify(payload), idempotencyKey });
}

export function listarPlazosFijos(estado?: PlazoFijo["estado"]) {
  const query = estado ? `?estado=${estado}&limit=50` : "?limit=50";
  return request<Paginado<PlazoFijo>>(`/plazos-fijos${query}`);
}

/**
 * Acredita al vencimiento. Antes de vencer hay que pedir `anticipada: true`
 * explícitamente: se reconoce el interés de los días corridos a una tasa menor.
 */
export function acreditarPlazoFijo(plazoFijoId: string, anticipada: boolean, idempotencyKey: string) {
  return request<ResultadoAcreditacion>(`/plazos-fijos/${plazoFijoId}/acreditacion`, {
    method: "POST",
    body: JSON.stringify({ anticipada }),
    idempotencyKey,
  });
}

/** Sólo roles internos. */
export function marcarPlazosFijosVencidos() {
  return request<{ vencidos: number }>("/plazos-fijos/marcar-vencidos", { method: "POST" });
}
