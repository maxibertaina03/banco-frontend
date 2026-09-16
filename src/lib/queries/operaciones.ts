// Queries y mutations del contrato v1: cuentas multimoneda, cambio, tarjetas,
// préstamos, plazos fijos, servicios y recargas.
//
// Regla de todas las mutations que mueven plata: al terminar invalidan
// `personas.full` (saldos) y `transacciones`, así el resumen y los movimientos
// se actualizan solos sin que la pantalla tenga que acordarse.

import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  abrirCuenta,
  listarMovimientos,
  obtenerResumenDeGastos,
} from "../../features/cuentas/api/cuentas.api";
import { crearCambio, obtenerCotizacion, obtenerTasas } from "../../features/cambio/api/cambio.api";
import {
  autorizarConsumo,
  cambiarEstadoTarjeta,
  emitirTarjeta,
  listarTarjetas,
  obtenerResumenTarjeta,
} from "../../features/tarjetas/api/tarjetas.api";
import {
  actualizarMora,
  listarPrestamos,
  obtenerPrestamo,
  pagarCuota,
  precancelarPrestamo,
  solicitarPrestamo,
} from "../../features/prestamos/api/prestamos.api";
import {
  acreditarPlazoFijo,
  constituirPlazoFijo,
  listarPlazosFijos,
  marcarPlazosFijosVencidos,
} from "../../features/inversiones/api/inversiones.api";
import {
  consultarDeuda,
  listarEmpresas,
  listarOperadoras,
  pagarFactura,
  recargarCelular,
} from "../../features/pagos/api/pagos.api";
import type { Moneda } from "../../features/common.types";
import { queryKeys } from "./keys";

function refrescarSaldos(qc: QueryClient, personaId: string | null | undefined) {
  if (personaId) {
    void qc.invalidateQueries({ queryKey: queryKeys.personas.full(personaId) });
    void qc.invalidateQueries({ queryKey: queryKeys.transacciones.byPersona(personaId) });
  }
  void qc.invalidateQueries({ queryKey: queryKeys.cuentas.all });
}

// ── Mercado ────────────────────────────────────────────────────────────────

export function useCotizacion() {
  return useQuery({
    queryKey: queryKeys.mercado.cotizacion(),
    queryFn: obtenerCotizacion,
    // El backend la cachea unos minutos; refrescar cada minuto alcanza.
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useTasas() {
  return useQuery({ queryKey: queryKeys.mercado.tasas(), queryFn: obtenerTasas, staleTime: 10 * 60_000 });
}

// ── Cuentas ────────────────────────────────────────────────────────────────

export function useMovimientos(cuentaId: string | null | undefined, page: number, limit = 10) {
  return useQuery({
    queryKey: cuentaId ? queryKeys.cuentas.movimientos(cuentaId, page) : ["cuentas", "movimientos", "disabled"],
    queryFn: () => listarMovimientos(cuentaId as string, page, limit),
    enabled: Boolean(cuentaId),
    placeholderData: keepPreviousData,
  });
}

export function useResumenDeGastos(cuentaId: string | null | undefined, periodo: string) {
  return useQuery({
    queryKey: cuentaId ? queryKeys.cuentas.resumenGastos(cuentaId, periodo) : ["cuentas", "resumenGastos", "disabled"],
    queryFn: () => obtenerResumenDeGastos(cuentaId as string, periodo),
    enabled: Boolean(cuentaId),
  });
}

export function useAbrirCuenta(personaId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { moneda: Moneda; alias?: string | null }) => abrirCuenta(personaId as string, payload),
    onSuccess: () => refrescarSaldos(qc, personaId),
  });
}

// ── Cambio ─────────────────────────────────────────────────────────────────

export function useCambioDeDivisa(personaId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idempotencyKey, ...payload }: Parameters<typeof crearCambio>[0] & { idempotencyKey: string }) =>
      crearCambio(payload, idempotencyKey),
    onSuccess: () => refrescarSaldos(qc, personaId),
  });
}

// ── Tarjetas ───────────────────────────────────────────────────────────────

export function useTarjetas(personaId: string | null | undefined) {
  return useQuery({
    queryKey: personaId ? queryKeys.tarjetas.byPersona(personaId) : ["tarjetas", "disabled"],
    queryFn: () => listarTarjetas(personaId as string),
    enabled: Boolean(personaId),
  });
}

export function useResumenTarjeta(tarjetaId: string | null | undefined) {
  return useQuery({
    queryKey: tarjetaId ? queryKeys.tarjetas.resumen(tarjetaId) : ["tarjetas", "resumen", "disabled"],
    queryFn: () => obtenerResumenTarjeta(tarjetaId as string),
    enabled: Boolean(tarjetaId),
  });
}

export function useEmitirTarjeta(personaId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: emitirTarjeta,
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.tarjetas.all }),
  });
}

export function useCambiarEstadoTarjeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tarjetaId, accion }: { tarjetaId: string; accion: "bloquear" | "desbloquear" }) =>
      cambiarEstadoTarjeta(tarjetaId, accion),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.tarjetas.all }),
  });
}

export function useAutorizarConsumo(personaId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tarjetaId,
      idempotencyKey,
      ...payload
    }: { tarjetaId: string; idempotencyKey: string; comercio: string; monto: number; cuotas?: number }) =>
      autorizarConsumo(tarjetaId, payload, idempotencyKey),
    // Aprobada o rechazada, cambia el disponible y el resumen; en débito, el saldo.
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tarjetas.all });
      refrescarSaldos(qc, personaId);
    },
  });
}

// ── Préstamos ──────────────────────────────────────────────────────────────

export function usePrestamos() {
  return useQuery({ queryKey: queryKeys.prestamos.list(), queryFn: () => listarPrestamos() });
}

export function usePrestamo(prestamoId: string | null | undefined) {
  return useQuery({
    queryKey: prestamoId ? queryKeys.prestamos.detalle(prestamoId) : ["prestamos", "detalle", "disabled"],
    queryFn: () => obtenerPrestamo(prestamoId as string),
    enabled: Boolean(prestamoId),
  });
}

function refrescarPrestamos(qc: QueryClient, personaId: string | null | undefined) {
  void qc.invalidateQueries({ queryKey: queryKeys.prestamos.all });
  refrescarSaldos(qc, personaId);
}

export function useSolicitarPrestamo(personaId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idempotencyKey, ...payload }: Parameters<typeof solicitarPrestamo>[0] & { idempotencyKey: string }) =>
      solicitarPrestamo(payload, idempotencyKey),
    onSuccess: () => refrescarPrestamos(qc, personaId),
  });
}

export function usePagarCuota(personaId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ prestamoId, idempotencyKey }: { prestamoId: string; idempotencyKey: string }) =>
      pagarCuota(prestamoId, idempotencyKey),
    onSuccess: () => refrescarPrestamos(qc, personaId),
  });
}

export function usePrecancelarPrestamo(personaId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ prestamoId, idempotencyKey }: { prestamoId: string; idempotencyKey: string }) =>
      precancelarPrestamo(prestamoId, idempotencyKey),
    onSuccess: () => refrescarPrestamos(qc, personaId),
  });
}

// ── Plazos fijos ───────────────────────────────────────────────────────────

export function usePlazosFijos() {
  return useQuery({ queryKey: queryKeys.plazosFijos.list(), queryFn: () => listarPlazosFijos() });
}

export function useConstituirPlazoFijo(personaId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idempotencyKey, ...payload }: Parameters<typeof constituirPlazoFijo>[0] & { idempotencyKey: string }) =>
      constituirPlazoFijo(payload, idempotencyKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.plazosFijos.all });
      refrescarSaldos(qc, personaId);
    },
  });
}

export function useAcreditarPlazoFijo(personaId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ plazoFijoId, anticipada, idempotencyKey }: { plazoFijoId: string; anticipada: boolean; idempotencyKey: string }) =>
      acreditarPlazoFijo(plazoFijoId, anticipada, idempotencyKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.plazosFijos.all });
      refrescarSaldos(qc, personaId);
    },
  });
}

// ── Procesos internos ──────────────────────────────────────────────────────
// Los dispara un rol interno a mano. El barrido de mora además informa al Banco
// Central, así que invalida préstamos para que el listado muestre los estados nuevos.

export function useActualizarMora() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actualizarMora,
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.prestamos.all }),
  });
}

export function useMarcarPlazosFijosVencidos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: marcarPlazosFijosVencidos,
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.plazosFijos.all }),
  });
}

// ── Servicios y recargas ───────────────────────────────────────────────────

export function useEmpresasDeServicios() {
  return useQuery({ queryKey: queryKeys.pagos.empresas(), queryFn: () => listarEmpresas(), staleTime: 15 * 60_000 });
}

export function useDeudaDeServicio(empresaId: string | null, numeroCliente: string | null) {
  return useQuery({
    queryKey: empresaId && numeroCliente ? queryKeys.pagos.deuda(empresaId, numeroCliente) : ["pagos", "deuda", "disabled"],
    queryFn: () => consultarDeuda(empresaId as string, numeroCliente as string),
    enabled: Boolean(empresaId && numeroCliente),
  });
}

export function usePagarFactura(personaId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idempotencyKey, ...payload }: Parameters<typeof pagarFactura>[0] & { idempotencyKey: string }) =>
      pagarFactura(payload, idempotencyKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.pagos.all });
      refrescarSaldos(qc, personaId);
    },
  });
}

export function useOperadoras() {
  return useQuery({ queryKey: queryKeys.pagos.operadoras(), queryFn: listarOperadoras, staleTime: 15 * 60_000 });
}

export function useRecargarCelular(personaId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idempotencyKey, ...payload }: Parameters<typeof recargarCelular>[0] & { idempotencyKey: string }) =>
      recargarCelular(payload, idempotencyKey),
    onSuccess: () => refrescarSaldos(qc, personaId),
  });
}
