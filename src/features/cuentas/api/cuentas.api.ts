import { request } from "../../../lib/api/client";
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
