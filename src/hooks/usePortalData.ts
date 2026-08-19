import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, setAccessTokenProvider } from "../lib/api/client";
import { formatCurrency } from "../lib/utils/currency";
import type { Cuenta } from "../features/cuentas/types/cuentas.types";
import { sanearIdDePersona } from "../features/personas/api/personas.api";
import type {
  PerfilUsuarioAutenticado,
  PersonaCompleta,
} from "../features/personas/types/personas.types";
import type { ActividadDeUsuario } from "../features/transacciones/types/transacciones.types";
import {
  queryKeys,
  usePerfilAutenticado,
  useCatalogosInternos,
  usePersonaFull,
  useTransaccionesDePersona,
  usePersonas,
} from "../lib/queries";

type GetTokenFn = () => Promise<string | null>;
const INTERNAL_PORTAL_ROLES = new Set(["admin", "operador", "auditor", "tesoreria"]);

function armarActividades(
  transacciones: Array<{
    id: string;
    monto: string | number;
    canal?: string | null;
    cuenta_origen_id?: string | null;
    cuenta_destino_id?: string | null;
    cuenta_origen_numero?: string | null;
    cuenta_destino_numero?: string | null;
    cbu_origen?: string | null;
    cbu_destino?: string | null;
    descripcion?: string | null;
    tipo_transaccion_nombre?: string | null;
    created_at: string;
  }>,
  cuentas: Cuenta[]
) {
  const idsCuenta = new Set(cuentas.map((cuenta) => cuenta.id));

  return transacciones.slice(0, 8).map((transaccion) => {
    const amount = Number(transaccion.monto || 0);
    const isEntrante = transaccion.canal === "interbancaria_entrante";
    const incoming =
      isEntrante ||
      (Boolean(transaccion.cuenta_destino_id) &&
        idsCuenta.has(transaccion.cuenta_destino_id as string) &&
        !idsCuenta.has(transaccion.cuenta_origen_id as string));

    const date = new Date(transaccion.created_at);

    let destinatario: string;
    if (incoming) {
      destinatario =
        transaccion.descripcion ||
        transaccion.cuenta_origen_numero ||
        (transaccion.cbu_origen ? `CBU ...${transaccion.cbu_origen.slice(-6)}` : "Transferencia entrante");
    } else {
      destinatario =
        transaccion.cuenta_destino_numero ||
        (transaccion.cbu_destino ? `CBU ...${transaccion.cbu_destino.slice(-6)}` : "Cuenta destino");
    }

    return {
      id: transaccion.id,
      type: incoming ? "in" : "out",
      title: transaccion.tipo_transaccion_nombre || "Movimiento",
      destinatario,
      amount: `${incoming ? "+" : "-"}${formatCurrency(Math.abs(amount))}`,
      date: new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(date),
      time: new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(date),
    } satisfies ActividadDeUsuario;
  });
}

function esPerfilInterno(perfilAutenticado: PerfilUsuarioAutenticado | null | undefined) {
  return Boolean(
    perfilAutenticado?.roles?.some((role) => INTERNAL_PORTAL_ROLES.has(String(role.nombre || "").toLowerCase()))
  );
}

interface UsePortalDataParams {
  getToken: GetTokenFn;
  initialPersonaId?: string;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  preferredPersonaId?: string;
  setError: (value: string | null) => void;
  setSuccess: (value: string | null) => void;
}

export function usePortalData({
  getToken,
  initialPersonaId,
  isLoaded,
  isSignedIn,
  preferredPersonaId,
  setError,
  setSuccess,
}: UsePortalDataParams) {
  const normalizedInitialPersonaId = sanearIdDePersona(initialPersonaId);
  const sanitizedPreferred = sanearIdDePersona(preferredPersonaId);
  const preferredHadInvalidPath = Boolean(preferredPersonaId) && !sanitizedPreferred;

  const queryClient = useQueryClient();

  // ── UI state local ──────────────────────────────────────────────────────────
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
  const [manualPersonaId, setManualPersonaId] = useState(normalizedInitialPersonaId);

  // ── Auth: token provider para el cliente HTTP ──────────────────────────────
  // Se setea ANTES de que las queries hagan fetch (Clerk hooks corren primero).
  const isAuthReady = isLoaded && Boolean(isSignedIn);
  useEffect(() => {
    if (!isAuthReady) {
      setAccessTokenProvider(null);
      return;
    }
    setAccessTokenProvider(() => getToken());
    return () => setAccessTokenProvider(null);
  }, [getToken, isAuthReady]);

  // ── Auth perfil ────────────────────────────────────────────────────────────
  const queryPerfilAutenticado = usePerfilAutenticado({ enabled: isAuthReady });
  const usuarioDelPerfil = (queryPerfilAutenticado.data?.user ?? null) as PerfilUsuarioAutenticado | null;
  const canLoadInternalCatalogs = esPerfilInterno(usuarioDelPerfil);

  // Si el usuario no es interno Y no tiene perfil completo, debe completar.
  const necesitaCompletarPerfil = useMemo(() => {
    if (!usuarioDelPerfil) return false;
    if (canLoadInternalCatalogs) return false;
    return usuarioDelPerfil.perfil_completo === false;
  }, [usuarioDelPerfil, canLoadInternalCatalogs]);

  // ── Resolver qué persona mostrar ───────────────────────────────────────────
  const directPersonaId =
    sanearIdDePersona(selectedPersonaId) ||
    sanearIdDePersona(manualPersonaId) ||
    sanitizedPreferred;

  // Solo internos listan todas las personas, y solo si no hay direct.
  const shouldListPersonas = !directPersonaId && canLoadInternalCatalogs;
  const personasQuery = usePersonas({ enabled: isAuthReady && shouldListPersonas });

  const activePersonaId =
    directPersonaId ||
    usuarioDelPerfil?.persona_id ||
    personasQuery.data?.[0]?.id ||
    "";

  // ── Queries dependientes de la persona activa ──────────────────────────────
  // Se deshabilitan si no hay persona o si falta completar perfil (no tiene
  // sentido pegarle al backend hasta que el usuario complete los datos).
  const perfilHabilitado = isAuthReady && Boolean(activePersonaId) && !necesitaCompletarPerfil;
  const personaFullQuery = usePersonaFull(perfilHabilitado ? activePersonaId : null);
  const queryTransacciones = useTransaccionesDePersona(perfilHabilitado ? activePersonaId : null);

  const perfil = (personaFullQuery.data ?? null) as PersonaCompleta | null;
  const transacciones = queryTransacciones.data ?? [];

  // ── Catálogos (solo internos) ──────────────────────────────────────────────
  const catalogs = useCatalogosInternos({
    enabled: isAuthReady && canLoadInternalCatalogs && !necesitaCompletarPerfil,
  });

  // ── Sincronizar selectedPersonaId con la persona realmente cargada ─────────
  useEffect(() => {
    if (perfil?.persona.id) {
      setSelectedPersonaId(perfil.persona.id);
      setManualPersonaId(perfil.persona.id);
    }
  }, [perfil?.persona.id]);

  // ── Derivados ──────────────────────────────────────────────────────────────
  const activities = useMemo(
    () => armarActividades(transacciones, perfil?.cuentas ?? []),
    [transacciones, perfil?.cuentas]
  );

  const warning = useMemo<string | null>(() => {
    if (necesitaCompletarPerfil) return null;
    // Warnings técnicos de bootstrap (VITE_PERSONA_ID inválido, fallback a
    // persona del JWT, etc.) se silencian — el sistema sigue operando OK y
    // un cliente final no debería ver mensajes con jerga interna.
    if (catalogs.failed && canLoadInternalCatalogs) {
      return "Algunas funciones del panel administrativo no están disponibles momentáneamente.";
    }
    return null;
  }, [necesitaCompletarPerfil, canLoadInternalCatalogs, catalogs.failed]);

  // ── Loading agregado ───────────────────────────────────────────────────────
  // Solo lo que bloquea el render principal: auth + perfil + transacciones.
  // Catálogos cargan en background.
  const loading =
    !isLoaded ||
    (isAuthReady &&
      (queryPerfilAutenticado.isLoading ||
        (perfilHabilitado && (personaFullQuery.isLoading || queryTransacciones.isLoading))));

  // ── Propagación de errores al banner del portal ────────────────────────────
  // Las queries reportan error individualmente; lo elevamos al estado global de
  // la página para mostrarlo en el banner. PROFILE_INCOMPLETE se trata distinto:
  // ya activa necesitaCompletarPerfil y muestra un mensaje específico.
  useEffect(() => {
    const queryError =
      queryPerfilAutenticado.error || personaFullQuery.error || queryTransacciones.error;
    if (!queryError) return;

    if (queryError instanceof ApiError && queryError.code === "PROFILE_INCOMPLETE") {
      setError(queryError.message);
      return;
    }
    setError(queryError instanceof Error ? queryError.message : "No pudimos cargar tu información. Intentá refrescar la página.");
  }, [queryPerfilAutenticado.error, personaFullQuery.error, queryTransacciones.error, setError]);

  // ── API imperativa de refresh ──────────────────────────────────────────────
  // Mantiene la signatura previa para no romper consumidores. Internamente
  // invalida las queries y deja que TanStack Query refetchee lo activo.

  const refrescarDatosDePersona = useCallback(
    async (personaId: string) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.personas.full(personaId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.transacciones.byPersona(personaId) }),
      ]);
    },
    [queryClient]
  );

  const refrescarDestinatarios = useCallback(
    async (personaId: string) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.personas.full(personaId) });
    },
    [queryClient]
  );

  // cargarPortal: si recibe personaIdOverride cambia la persona activa (lo cual
  // dispara nuevos fetchs por cambio de queryKey); si no, invalida todo lo
  // relacionado al portal para forzar refetch.
  const cargarPortal = useCallback(
    async (
      personaIdOverride?: string,
      _options?: { skipCatalogReload?: boolean } // catálogos tienen staleTime alto, no necesitan flag
    ) => {
      setError(null);
      setSuccess(null);

      const override = sanearIdDePersona(personaIdOverride);
      if (override) {
        setSelectedPersonaId(override);
        setManualPersonaId(override);
        // El cambio de personaId dispara fetch automático vía queryKey.
        return;
      }

      // Reload generalizado: auth, persona activa, catálogos.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.perfil }),
        activePersonaId
          ? queryClient.invalidateQueries({ queryKey: queryKeys.personas.full(activePersonaId) })
          : Promise.resolve(),
        activePersonaId
          ? queryClient.invalidateQueries({
              queryKey: queryKeys.transacciones.byPersona(activePersonaId),
            })
          : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: queryKeys.catalogos.all }),
      ]);
    },
    [activePersonaId, queryClient, setError, setSuccess]
  );

  return {
    tiposDeCuenta: catalogs.tiposCuenta,
    activities,
    perfilAutenticado: usuarioDelPerfil,
    banks: catalogs.bancos,
    cargarPortal,
    loading,
    manualPersonaId,
    necesitaCompletarPerfil,
    personas: personasQuery.data ?? [],
    perfil,
    refrescarDestinatarios,
    refrescarDatosDePersona,
    roles: catalogs.roles,
    selectedPersonaId,
    setManualPersonaId,
    setSelectedPersonaId,
    tiposDeTransaccion: catalogs.tiposTransaccion,
    warning,
  };
}
