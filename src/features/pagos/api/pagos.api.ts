// Servicios y recargas, contra el contrato del banco (tags Servicios y Recargas
// de openapi-banco-orbital.yaml).
//
// Mientras el backend no implemente esas rutas, `VITE_PAGOS_MOCK=true` hace que
// las pantallas usen un mock local con los mismos datos que banco-proveedores.
// Cuando las rutas existan, se borra la variable y no cambia nada más.

import { request } from "../../../lib/api/client";
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

export const USA_MOCK_DE_PAGOS = import.meta.env.VITE_PAGOS_MOCK === "true";

export function listarEmpresas(rubro?: Rubro) {
  if (USA_MOCK_DE_PAGOS) return mock.listarEmpresas(rubro);
  return request<EmpresaServicio[]>(`/servicios/empresas${rubro ? `?rubro=${rubro}` : ""}`);
}

export function consultarDeuda(empresaId: string, numeroCliente: string) {
  if (USA_MOCK_DE_PAGOS) return mock.consultarDeuda(empresaId, numeroCliente);
  return request<DeudaDeCliente>(
    `/servicios/empresas/${encodeURIComponent(empresaId)}/deuda?numero_cliente=${encodeURIComponent(numeroCliente)}`
  );
}

/** Sin monto: el banco lo toma de la factura. */
export function pagarFactura(
  payload: { cuenta_id: string; empresa_id: string; numero_cliente: string; factura_id: string },
  idempotencyKey: string
) {
  if (USA_MOCK_DE_PAGOS) return mock.pagarFactura(payload);
  return request<ResultadoPagoServicio>("/servicios/pagos", {
    method: "POST",
    body: JSON.stringify(payload),
    idempotencyKey,
  });
}

export function listarOperadoras() {
  if (USA_MOCK_DE_PAGOS) return mock.listarOperadoras();
  return request<Operadora[]>("/recargas/operadoras");
}

export function recargarCelular(
  payload: { cuenta_id: string; operadora_id: string; numero: string; monto: number },
  idempotencyKey: string
) {
  if (USA_MOCK_DE_PAGOS) return mock.recargarCelular(payload);
  return request<ResultadoRecarga>("/recargas", { method: "POST", body: JSON.stringify(payload), idempotencyKey });
}
