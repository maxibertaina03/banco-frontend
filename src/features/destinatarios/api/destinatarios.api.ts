import { request } from "../../../lib/api/client";
import type { RecipientRecord } from "../types/destinatarios.types";

export type { RecipientRecord } from "../types/destinatarios.types";

export function createDestinatario(payload: {
  persona_id: string;
  alias?: string | null;
  cbu_externo: string;
  banco_externo?: string | null;
}) {
  return request<RecipientRecord>("/destinatarios", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDestinatario(
  destinatarioId: string,
  payload: Partial<{
    alias: string | null;
    cbu_externo: string;
    banco_externo: string | null;
  }>
) {
  return request<RecipientRecord>(`/destinatarios/${destinatarioId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteDestinatario(destinatarioId: string) {
  return request<{ message: string }>(`/destinatarios/${destinatarioId}`, {
    method: "DELETE",
  });
}
