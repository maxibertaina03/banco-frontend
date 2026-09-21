import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  crearTransferencia,
  obtenerTransaccionesDePersonaPorId,
  sincronizarTransaccionesEntrantes,
  type SyncIncomingResult,
} from "../../features/transacciones/api/transacciones.api";
import { queryKeys } from "./keys";

export function useTransaccionesDePersona(personaId: string | null | undefined) {
  return useQuery({
    queryKey: personaId
      ? queryKeys.transacciones.byPersona(personaId)
      : ["transacciones", "byPersona", "disabled"],
    queryFn: () => obtenerTransaccionesDePersonaPorId(personaId as string),
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
export function useCrearTransferencia(personaId: string | null | undefined) {
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
    }) => crearTransferencia(payload, { idempotencyKey }),
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

/** Hubo algo nuevo que mostrar: acreditado o registrado como no acreditado. */
function trajoNovedades(resultado: SyncIncomingResult) {
  return resultado.synced > 0 || (resultado.rechazadas ?? 0) > 0;
}

// Refresca todo lo que muestra saldos o movimientos. Amplio a propósito: sólo
// corre cuando llegó algo, y así no importa qué persona esté mirando el portal.
function refrescarTrasSincronizar(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: queryKeys.personas.all });
  void qc.invalidateQueries({ queryKey: queryKeys.transacciones.all });
  void qc.invalidateQueries({ queryKey: queryKeys.cuentas.all });
}

export function useSyncIncoming(personaId: string | null | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => sincronizarTransaccionesEntrantes(),
    onSuccess: (result) => {
      if (!personaId || !trajoNovedades(result)) return;
      refrescarTrasSincronizar(qc);
    },
  });
}

const INTERVALO_SINCRONIZACION_MS = 2 * 60_000;

/**
 * Trae las transferencias que otros bancos nos mandaron, sin que el titular
 * tenga que hacer nada.
 *
 * El que garantiza que ninguna se pierda es el backend, que consulta al Central
 * cada 15 minutos por su cuenta. Esto es para la inmediatez: que quien tiene el
 * portal abierto la vea enseguida. Corre al cargar, al volver a la pestaña y
 * cada 2 minutos mientras está visible (en segundo plano no, para no consultar
 * al Central de más).
 *
 * Repetirla es seguro: el backend tiene un índice único por transferencia, así
 * que dos pestañas sincronizando a la vez no acreditan dos veces.
 */
export function useSincronizacionAutomatica(personaId: string | null | undefined) {
  const qc = useQueryClient();

  return useQuery({
    // Fuera de `transacciones.all` a propósito: si no, cada invalidación de
    // movimientos dispararía otra sincronización.
    queryKey: ["sincronizacion-entrantes", personaId ?? "sin-sesion"],
    queryFn: async () => {
      const resultado = await sincronizarTransaccionesEntrantes();
      if (trajoNovedades(resultado)) refrescarTrasSincronizar(qc);
      return resultado;
    },
    enabled: Boolean(personaId),
    refetchInterval: INTERVALO_SINCRONIZACION_MS,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
    // Si el Central no responde, se reintenta en el próximo ciclo, no en ráfaga.
    retry: false,
  });
}
