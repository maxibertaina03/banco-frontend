import { request } from "../../../lib/api/client";
import type { Cuenta } from "../../cuentas/types/cuentas.types";
import type {
  TipoTransaccionRecord,
  Transaccion,
  ActividadDeUsuario,
} from "../types/transacciones.types";

export type {
  TipoTransaccionRecord,
  Transaccion,
  ActividadDeUsuario,
} from "../types/transacciones.types";

interface ListResponse<T> {
  data: T[];
}

export async function listarTiposDeTransaccion() {
  const response = await request<ListResponse<TipoTransaccionRecord>>("/tipos-transaccion?limit=50");
  return response.data;
}

export function obtenerTransaccionesDeCuenta(idCuenta: string) {
  return request<Transaccion[]>(`/cuentas/${idCuenta}/transacciones`);
}

export function obtenerTransaccionesDePersonaPorId(personaId: string) {
  return request<Transaccion[]>(`/personas/${personaId}/transacciones`);
}

export async function obtenerTransaccionesDePersona(cuentas: Cuenta[]) {
  const transactionGroups = await Promise.all(cuentas.map((cuenta) => obtenerTransaccionesDeCuenta(cuenta.id)));
  const transaccionesUnicas = new Map<string, Transaccion>();

  for (const group of transactionGroups) {
    for (const transaccion of group) {
      transaccionesUnicas.set(transaccion.id, transaccion);
    }
  }

  return Array.from(transaccionesUnicas.values()).sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );
}

export function crearTransferencia(
  payload: {
    cbuOrigen: string;
    cbuDestino: string;
    importe: number;
    saldoOrigen: number;
  },
  options?: { idempotencyKey?: string }
) {
  return request<Transaccion>("/transacciones", {
    method: "POST",
    body: JSON.stringify(payload),
    idempotencyKey: options?.idempotencyKey,
  });
}

export interface DestinatarioResuelto {
  alias: string | null;
  cbu: string | null;
  titular: string | null;
  banco: string | null;
}

export function resolverDestinatario(params: { alias?: string; cbu?: string }) {
  const query = params.alias
    ? `alias=${encodeURIComponent(params.alias)}`
    : `cbu=${encodeURIComponent(params.cbu ?? "")}`;
  return request<DestinatarioResuelto>(`/transacciones/destinatario/resolver?${query}`);
}

export interface SyncIncomingResult {
  processed: number;
  synced: number;
  already_recorded: number;
  errors: number;
}

export function sincronizarTransaccionesEntrantes() {
  return request<SyncIncomingResult>("/transacciones/sync-incoming", { method: "POST" });
}
