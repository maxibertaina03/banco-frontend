import { request } from "../../../lib/api/client";
import type { Destinatario } from "../types/destinatarios.types";

export type { Destinatario } from "../types/destinatarios.types";

export function crearDestinatario(payload: {
  persona_id: string;
  alias?: string | null;
  cbu_externo: string;
  banco_externo?: string | null;
}) {
  return request<Destinatario>("/destinatarios", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function actualizarDestinatario(
  destinatarioId: string,
  payload: Partial<{
    alias: string | null;
    cbu_externo: string;
    banco_externo: string | null;
  }>
) {
  return request<Destinatario>(`/destinatarios/${destinatarioId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function eliminarDestinatario(destinatarioId: string) {
  return request<{ message: string }>(`/destinatarios/${destinatarioId}`, {
    method: "DELETE",
  });
}
