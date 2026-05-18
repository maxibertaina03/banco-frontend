import { request } from "../../../lib/api/client";
import type { AccountRecord, TipoCuentaRecord } from "../types/cuentas.types";

export type { AccountRecord, TipoCuentaRecord } from "../types/cuentas.types";

interface ListResponse<T> {
  data: T[];
}

export async function listTiposCuenta() {
  const response = await request<ListResponse<TipoCuentaRecord>>("/tipos-cuenta?limit=50");
  return response.data;
}

export function createCuenta(payload: {
  persona_id: string;
  tipo_cuenta_id: string;
  numero_cuenta: string;
  cbu: string;
  saldo?: string | number;
  activa?: boolean;
}) {
  return request<AccountRecord>("/cuentas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAlias(cbu: string, alias: string) {
  return request<{ message: string }>(`/persons/${cbu}/alias`, {
    method: "PUT",
    body: JSON.stringify({ alias }),
  });
}
