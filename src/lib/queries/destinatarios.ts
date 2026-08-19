import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crearDestinatario, eliminarDestinatario } from "../../features/destinatarios/api/destinatarios.api";
import { queryKeys } from "./keys";

// La lista de destinatarios viene dentro de `obtenerPersonaCompleta` (no hay endpoint
// dedicado), así que invalidar el perfil completo es suficiente para refrescar.

export function useCrearDestinatario(personaId: string | null | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      persona_id: string;
      alias?: string | null;
      cbu_externo: string;
      banco_externo?: string | null;
    }) => crearDestinatario(payload),
    onSuccess: () => {
      if (!personaId) return;
      qc.invalidateQueries({ queryKey: queryKeys.personas.full(personaId) });
    },
  });
}

export function useEliminarDestinatario(personaId: string | null | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (destinatarioId: string) => eliminarDestinatario(destinatarioId),
    onSuccess: () => {
      if (!personaId) return;
      qc.invalidateQueries({ queryKey: queryKeys.personas.full(personaId) });
    },
  });
}
