import { request } from "../../../lib/api/client";

export interface CobroQr {
  id: string;
  titular: string;
  monto: number | string;
  estado: "pendiente" | "pagado" | "vencido" | "cancelado";
  expira_at: string;
}

export interface NuevoCobroQr {
  id: string;
  monto: number | string;
  estado: "pendiente";
  expira_at: string;
  creado_at: string;
}

export function crearCobroQr(monto: number) {
  return request<NuevoCobroQr>("/cobros", {
    method: "POST",
    body: JSON.stringify({ monto }),
  });
}

export function consultarCobroQr(id: string) {
  return request<CobroQr>(`/cobros/${encodeURIComponent(id)}`);
}

export function transferirCobroQr(id: string, idempotencyKey: string) {
  return request<{ id: string; estado: string; fecha: string }>("/transferencias", {
    method: "POST",
    body: JSON.stringify({ cobro_id: id }),
    idempotencyKey,
    clerkReverification: true,
  });
}
