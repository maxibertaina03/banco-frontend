// Servicios y recargas, contra el contrato del banco (tags Servicios y Recargas
// de openapi-banco-orbital.yaml).
//
// `VITE_PAGOS_MOCK=true` permite probar las pantallas con datos locales. Una
// sesión demo siempre usa ese mock, para no llamar al proveedor ni debitar
// ninguna cuenta de verdad.

import { request } from "../../../lib/api/client";
import { haySesionDemo } from "../../demo/sesion-demo";
import * as mock from "./pagos.mock";
import type {
  DeudaDeCliente,
  EmpresaServicio,
  Operadora,
  ResultadoPagoServicio,
  ResultadoRecarga,
  Rubro,
} from "../types/pagos.types";

export type * from "../types/pagos.types";

export function usaMockPagos() {
  return import.meta.env.VITE_PAGOS_MOCK === "true" || haySesionDemo();
}

export function listarEmpresas(rubro?: Rubro) {
  if (usaMockPagos()) return mock.listarEmpresas(rubro);
  return request<EmpresaServicio[]>(`/servicios/empresas${rubro ? `?rubro=${rubro}` : ""}`);
}

export function consultarDeuda(empresaId: string, numeroCliente: string) {
  if (usaMockPagos()) return mock.consultarDeuda(empresaId, numeroCliente);
  return request<DeudaDeCliente>(
    `/servicios/empresas/${encodeURIComponent(empresaId)}/deuda?numero_cliente=${encodeURIComponent(numeroCliente)}`
  );
}

/** Sin monto: el banco lo toma de la factura. */
export function pagarFactura(
  payload: { cuenta_id: string; empresa_id: string; numero_cliente: string; factura_id: string },
  idempotencyKey: string
) {
  if (usaMockPagos()) return mock.pagarFactura(payload);
  return request<ResultadoPagoServicio>("/servicios/pagos", {
    method: "POST",
    body: JSON.stringify(payload),
    idempotencyKey,
  });
}

export function listarOperadoras() {
  if (usaMockPagos()) return mock.listarOperadoras();
  return request<Operadora[]>("/recargas/operadoras");
}

export function recargarCelular(
  payload: { cuenta_id: string; operadora_id: string; numero: string; monto: number },
  idempotencyKey: string
) {
  if (usaMockPagos()) return mock.recargarCelular(payload);
  return request<ResultadoRecarga>("/recargas", { method: "POST", body: JSON.stringify(payload), idempotencyKey });
}
