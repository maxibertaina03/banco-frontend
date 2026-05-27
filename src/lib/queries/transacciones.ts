import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTransfer,
  getPersonaTransactionsById,
  syncIncomingTransactions,
} from "../../features/transacciones/api/transacciones.api";
import { queryKeys } from "./keys";

export function usePersonaTransactions(personaId: string | null | undefined) {
  return useQuery({
    queryKey: personaId
      ? queryKeys.transacciones.byPersona(personaId)
      : ["transacciones", "byPersona", "disabled"],
    queryFn: () => getPersonaTransactionsById(personaId as string),
    enabled: Boolean(personaId),
  });
}

// Mutation de transferencia. Al completarse, invalida los datos de la persona
// (saldo de cuentas) y su lista de transacciones — TanStack Query refetchea
// automáticamente las queries activas que matcheen.
//
// `idempotencyKey` (opcional): UUID v4 generado por el caller. Si el usuario
// reintenta la misma operación (red mala, etc.) con la misma key, el backend
// devuelve la respuesta cacheada sin re-ejecutar la transferencia.
export function useCreateTransfer(personaId: string | null | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      idempotencyKey,
      ...payload
    }: {
      cbuOrigen: string;
      cbuDestino: string;
      importe: number;
      saldoOrigen: number;
      idempotencyKey?: string;
    }) => createTransfer(payload, { idempotencyKey }),
    onSuccess: () => {
      if (!personaId) return;
      qc.invalidateQueries({ queryKey: queryKeys.personas.full(personaId) });
      qc.invalidateQueries({ queryKey: queryKeys.transacciones.byPersona(personaId) });
    },
    onError: (error, _vars, _ctx) => {
      // El status 422 también deja la transacción registrada como rechazada,
      // así que igualmente refrescamos para mostrar el nuevo registro.
      const status = (error as { status?: number })?.status;
      if (status === 422 || status === 400) {
        if (personaId) {
          qc.invalidateQueries({ queryKey: queryKeys.personas.full(personaId) });
          qc.invalidateQueries({ queryKey: queryKeys.transacciones.byPersona(personaId) });
        }
      }
    },
  });
}

export function useSyncIncoming(personaId: string | null | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => syncIncomingTransactions(),
    onSuccess: (result) => {
      if (!personaId || result.synced <= 0) return;
      qc.invalidateQueries({ queryKey: queryKeys.personas.full(personaId) });
      qc.invalidateQueries({ queryKey: queryKeys.transacciones.byPersona(personaId) });
    },
  });
}
