import { request, requestArchivo } from "../../../lib/api/client";
import type { Moneda, Paginado } from "../../common.types";
import type { Transaccion } from "../../transacciones/types/transacciones.types";
import type { Cuenta, TipoCuentaRecord } from "../types/cuentas.types";

export type { Cuenta, TipoCuentaRecord } from "../types/cuentas.types";

interface ListResponse<T> {
  data: T[];
}

export async function listarTiposDeCuenta() {
  const response = await request<ListResponse<TipoCuentaRecord>>("/tipos-cuenta?limit=50");
  return response.data;
}

export function crearCuenta(payload: {
  persona_id: string;
  tipo_cuenta_id: string;
  numero_cuenta: string;
  cbu: string;
  saldo?: string | number;
  activa?: boolean;
}) {
  return request<Cuenta>("/cuentas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function actualizarAlias(cbu: string, alias: string) {
  return request<{ message: string }>(`/central-bank/persons/${cbu}/alias`, {
    method: "PUT",
    body: JSON.stringify({ alias }),
  });
}

// ── Contrato v1 ────────────────────────────────────────────────────────────


/**
 * Abre una caja de ahorro. Responde 201 si la creó y 200 si ya existía, así que
 * reintentar es seguro. 403 si la persona tiene situación crediticia 3 o peor.
 */
export function abrirCuenta(personaId: string, payload: { moneda: Moneda; alias?: string | null }) {
  return request<Cuenta>(`/personas/${personaId}/cuentas/apertura`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listarMovimientos(cuentaId: string, page = 1, limit = 20) {
  return request<Paginado<Transaccion>>(`/cuentas/${cuentaId}/movimientos?page=${page}&limit=${limit}`);
}

export interface CategoriaDeGasto {
  categoria: string;
  tipo: "gasto" | "ingreso";
  total: number;
  cantidad: number;
}

export interface ResumenDeGastos {
  periodo: string;
  total_gastos: number;
  total_ingresos: number;
  balance: number;
  categorias: CategoriaDeGasto[];
}

export function obtenerResumenDeGastos(cuentaId: string, periodo?: string) {
  const query = periodo ? `?periodo=${periodo}` : "";
  return request<ResumenDeGastos>(`/cuentas/${cuentaId}/resumen-gastos${query}`);
}

export function exportarMovimientos(cuentaId: string, rango: { desde?: string; hasta?: string } = {}) {
  const params = new URLSearchParams();
  if (rango.desde) params.set("desde", rango.desde);
  if (rango.hasta) params.set("hasta", rango.hasta);
  const query = params.toString() ? `?${params}` : "";
  return requestArchivo(`/cuentas/${cuentaId}/movimientos/exportar${query}`);
}
