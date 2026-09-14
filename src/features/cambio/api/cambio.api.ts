import { request } from "../../../lib/api/client";
import type { Transaccion } from "../../transacciones/types/transacciones.types";

export interface Cotizacion {
  moneda: string;
  casa: string;
  /** Pesos que el banco paga por cada dólar que le compra al cliente. */
  compra: number;
  /** Pesos que el cliente paga por cada dólar que le compra al banco. */
  venta: number;
  fecha_actualizacion: string;
  /** Presente cuando DolarAPI no respondió y se muestra el último valor conocido. */
  desde_respaldo?: boolean;
}

export interface TasasDeReferencia {
  prestamos: { tna: number | null };
  plazo_fijo: { tna: number | null };
  actualizado_al?: string;
}

export interface ResultadoCambio {
  transaccion: Transaccion;
  operacion: "compra" | "venta";
  monto_origen: number;
  monto_destino: number;
  cotizacion_aplicada: number;
}

export function obtenerCotizacion() {
  return request<Cotizacion>("/catalogos/cotizacion");
}

export function obtenerTasas() {
  return request<TasasDeReferencia>("/catalogos/tasas");
}

/**
 * Compra o venta entre las dos cajas del mismo titular. La operación la deduce
 * el backend de las monedas; se manda igual porque el contrato la declara.
 * `monto` va en la moneda de la cuenta de origen. 503 si no hay cotización vigente.
 */
export function crearCambio(
  payload: { operacion: "compra" | "venta"; cuenta_origen_id: string; cuenta_destino_id: string; monto: number },
  idempotencyKey: string
) {
  return request<ResultadoCambio>("/transacciones/cambio", {
    method: "POST",
    body: JSON.stringify(payload),
    idempotencyKey,
  });
}
