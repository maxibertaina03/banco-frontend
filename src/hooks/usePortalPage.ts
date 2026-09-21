import { useAuth } from "@clerk/clerk-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PREFERRED_PERSONA_ID } from "../lib/constants/portal";
import { sanearIdDePersona } from "../features/personas/api/personas.api";
import type { RolDePortal } from "../features/personas/types/personas.types";
import type { Transaccion } from "../features/transacciones/types/transacciones.types";
import type { Section } from "../pages/portal.config";
import { useNotifications } from "./useNotifications";
import { useSincronizacionAutomatica, useTransaccionesDePersona } from "../lib/queries";
import { usePortalActions } from "./usePortalActions";
import { usePortalData } from "./usePortalData";
import { usePortalForms } from "./usePortalForms";
import { obtenerOpcionesDeRol, obtenerAlcanceDeRol } from "../features/personas/api/personas.api";
import { totalesPorMoneda } from "../lib/utils/currency";

export function usePortalPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const initialPersonaId = sanearIdDePersona(PREFERRED_PERSONA_ID);

  const [rolActivo, setRolActivo] = useState<RolDePortal>("cliente");
  const [section, setSection] = useState<Section>("dashboard");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    tiposDeCuenta,
    activities,
    perfilAutenticado,
    banks,
    cargarPortal,
    loading,
    manualPersonaId,
    necesitaCompletarPerfil,
    personas,
    perfil,
    refrescarDestinatarios,
    refrescarDatosDePersona,
    roles,
    selectedPersonaId,
    setManualPersonaId,
    setSelectedPersonaId,
    tiposDeTransaccion,
    warning,
  } = usePortalData({
    getToken,
    initialPersonaId,
    isLoaded,
    isSignedIn,
    preferredPersonaId: PREFERRED_PERSONA_ID,
    setError,
    setSuccess,
  });

  const {
    createClientForm,
    cuentaSeleccionadaParaAlias,
    setCreateClientForm,
    setCuentaSeleccionadaParaAlias,
  } = usePortalForms();

  const roleOptions = useMemo<RolDePortal[]>(() => (perfil ? obtenerOpcionesDeRol(perfil) : ["cliente"]), [perfil]);
  const scope = obtenerAlcanceDeRol(rolActivo);
  // Por moneda: con cajas en USD, sumar todos los saldos mezcla pesos con dólares.
  const totales = useMemo(() => totalesPorMoneda(perfil?.cuentas ?? []), [perfil]);
  const totalBalance = totales.ARS;
  const tieneCajaEnDolares = Boolean(perfil?.cuentas.some((cuenta) => cuenta.moneda === "USD"));

  // La caja en pesos que nació con la persona. Con cajas en USD, `cuentas[0]`
  // podía ser la de dólares, y el resumen mostraba y copiaba ese CBU como el principal.
  const cuentaPrincipal = useMemo(
    () =>
      perfil?.cuentas.find((cuenta) => cuenta.principal) ??
      perfil?.cuentas.find((cuenta) => (cuenta.moneda ?? "ARS") === "ARS") ??
      perfil?.cuentas[0] ??
      null,
    [perfil]
  );

  const queryTransaccionesDePersona = useTransaccionesDePersona(perfil?.persona.id);

  // Las transferencias de otros bancos se traen solas, en cualquier pestaña del
  // portal. Con el usuario autenticado, que es de quien sincroniza el backend.
  useSincronizacionAutomatica(perfilAutenticado?.persona_id);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    personaId: perfil?.persona.id,
    transacciones: queryTransaccionesDePersona.data ?? [],
    cuentas: perfil?.cuentas ?? [],
  });

  const {
    bulkSyncing,
    handleBulkSync,
    manejarCompletarPerfil,
    handleCreateClient,
    manejarCrearDestinatario,
    manejarEliminarDestinatario,
    manejarSincronizarCuenta,
    handleSyncIncoming,
    manejarTransferir,
    lastSyncResult,
    contadorResetDestinatario,
    idCuentaSincronizando,
    syncingIncoming,
    contadorResetTransferencia,
    comprobanteTransferencia,
    setComprobanteTransferencia,
  } = usePortalActions({
    createClientForm,
    cargarPortal,
    perfil,
    refrescarDestinatarios,
    refrescarDatosDePersona,
    setCreateClientForm,
    setError,
    setSubmitting,
    setSuccess,
  });

  // Detalle de un movimiento: al tocar uno en la lista, lo buscamos en las
  // transacciones que ya tenemos cargadas (mismas que alimentan notificaciones).
  const [transaccionSeleccionada, setTransaccionSeleccionada] = useState<Transaccion | null>(null);
  const abrirDetalleDeTransaccion = useCallback(
    (idTransaccion: string) => {
      const found = (queryTransaccionesDePersona.data ?? []).find((tx) => tx.id === idTransaccion);
      if (found) setTransaccionSeleccionada(found);
    },
    [queryTransaccionesDePersona.data],
  );

  useEffect(() => {
    if (scope === "user" && section === "admin") {
      setSection("dashboard");
    }
  }, [scope, section]);

  const manejarIrACuentas = useCallback(() => setSection("cuentas"), []);
  const handleLoadPersona = useCallback((personaId?: string) => void cargarPortal(personaId), [cargarPortal]);
  const handleCopyCbu = useCallback(() => {
    const cbu = cuentaPrincipal?.cbu;
    if (cbu) {
      void navigator.clipboard.writeText(cbu);
      setSuccess("CBU copiado al portapapeles.");
    }
  }, [cuentaPrincipal]);
  const handleCopyAlias = useCallback(() => {
    const alias = cuentaPrincipal?.alias;
    if (alias) {
      void navigator.clipboard.writeText(alias);
      setSuccess("Alias copiado al portapapeles.");
    }
  }, [cuentaPrincipal]);
  const handleAliasUpdated = useCallback(() => {
    setSuccess("Alias actualizado correctamente.");
    setCuentaSeleccionadaParaAlias(null);
    void cargarPortal(perfil?.persona.id);
  }, [cargarPortal, perfil?.persona.id, setCuentaSeleccionadaParaAlias]);
  const manejarSincronizarCuentaCb = useCallback((idCuenta: string) => void manejarSincronizarCuenta(idCuenta), [manejarSincronizarCuenta]);
  const handleBulkSyncCb = useCallback(() => void handleBulkSync(), [handleBulkSync]);
  const handleSyncIncomingCb = useCallback(() => void handleSyncIncoming(), [handleSyncIncoming]);
  const manejarEliminarDestinatarioCb = useCallback(
    (destinatario: { id: string }) => void manejarEliminarDestinatario(destinatario.id),
    [manejarEliminarDestinatario],
  );
  const manejarCuentaSincronizada = useCallback(
    async () => { await cargarPortal(perfil?.persona.id, { skipCatalogReload: true }); },
    [cargarPortal, perfil?.persona.id],
  );

  return {
    // State
    rolActivo,
    setRolActivo,
    section,
    setSection,
    submitting,
    error,
    setError,
    success,
    setSuccess,

    // Portal data
    tiposDeCuenta,
    activities,
    perfilAutenticado,
    banks,
    loading,
    manualPersonaId,
    necesitaCompletarPerfil,
    personas,
    perfil,
    roles,
    selectedPersonaId,
    tiposDeTransaccion,
    warning,

    // Computed
    roleOptions,
    scope,
    totalBalance,
    totalUsd: tieneCajaEnDolares ? totales.USD : null,
    cuentaPrincipal,

    // Notifications
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,

    // Forms
    createClientForm,
    setCreateClientForm,
    cuentaSeleccionadaParaAlias,
    setCuentaSeleccionadaParaAlias,

    // Actions
    bulkSyncing,
    lastSyncResult,
    contadorResetDestinatario,
    idCuentaSincronizando,
    syncingIncoming,
    contadorResetTransferencia,

    // Comprobante de transferencia + detalle de movimiento
    comprobanteTransferencia,
    setComprobanteTransferencia,
    transaccionSeleccionada,
    setTransaccionSeleccionada,
    abrirDetalleDeTransaccion,

    // Handlers
    manejarIrACuentas,
    handleLoadPersona,
    handleCopyCbu,
    handleCopyAlias,
    handleAliasUpdated,
    manejarSincronizarCuentaCb,
    handleBulkSyncCb,
    handleSyncIncomingCb,
    manejarEliminarDestinatarioCb,
    manejarCuentaSincronizada,
    manejarCompletarPerfil,
    handleCreateClient,
    manejarCrearDestinatario,
    manejarEliminarDestinatario,
    manejarTransferir,

    // Utilities
    setManualPersonaId,
    setSelectedPersonaId,
    refrescarDestinatarios,
    refrescarDatosDePersona,
    cargarPortal,
  };
}
