import { request } from "../../../lib/api/client";
import type { Paginado } from "../../common.types";
import type {
  Prestamo,
  ResultadoPagoCuota,
  ResultadoPrecancelacion,
  SimulacionPrestamo,
} from "../types/prestamos.types";

export type * from "../types/prestamos.types";

/** Sin `tna` usa la tasa de referencia del mercado. */
export function simularPrestamo(payload: { capital: number; cuotas: number; tna?: number | null }) {
  return request<SimulacionPrestamo>("/prestamos/simulaciones", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Otorga el préstamo y acredita el capital en `cuenta_id`, que define la moneda.
 * 403 si la situación crediticia en el Banco Central es 3 o peor.
 */
export function solicitarPrestamo(
  payload: { cuenta_id: string; capital: number; cuotas: number; tna?: number | null },
  idempotencyKey: string
) {
  return request<Prestamo>("/prestamos", { method: "POST", body: JSON.stringify(payload), idempotencyKey });
}

export function listarPrestamos(estado?: Prestamo["estado"]) {
  const query = estado ? `?estado=${estado}&limit=50` : "?limit=50";
  return request<Paginado<Prestamo>>(`/prestamos${query}`);
}

export function obtenerPrestamo(prestamoId: string) {
  return request<Prestamo>(`/prestamos/${prestamoId}`);
}

export function pagarCuota(prestamoId: string, idempotencyKey: string) {
  return request<ResultadoPagoCuota>(`/prestamos/${prestamoId}/pagos`, { method: "POST", idempotencyKey });
}

export function precancelarPrestamo(prestamoId: string, idempotencyKey: string) {
  return request<ResultadoPrecancelacion>(`/prestamos/${prestamoId}/precancelacion`, {
    method: "POST",
    idempotencyKey,
  });
}

/** Barrido de mora. Sólo roles internos. */
export function actualizarMora() {
  return request<{ revisados: number; en_mora: number; informados: number; errores: number }>(
    "/prestamos/actualizar-mora",
    { method: "POST" }
  );
}
