import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, setAccessTokenProvider } from "../lib/api/client";
import { formatCurrency } from "../lib/utils/currency";
import type { AccountRecord } from "../features/cuentas/types/cuentas.types";
import { sanitizePersonaId } from "../features/personas/api/personas.api";
import type {
  AuthenticatedUserProfile,
  PersonaFullResponse,
} from "../features/personas/types/personas.types";
import type { UserActivity } from "../features/transacciones/types/transacciones.types";
import {
  queryKeys,
  useAuthProfile,
  useInternalCatalogs,
  usePersonaFull,
  usePersonaTransactions,
  usePersonas,
} from "../lib/queries";

type GetTokenFn = () => Promise<string | null>;
const INTERNAL_PORTAL_ROLES = new Set(["admin", "operador", "auditor", "tesoreria"]);

function buildActivities(
  transactions: Array<{
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
  accounts: AccountRecord[]
) {
  const accountIds = new Set(accounts.map((account) => account.id));

  return transactions.slice(0, 8).map((transaction) => {
    const amount = Number(transaction.monto || 0);
    const isEntrante = transaction.canal === "interbancaria_entrante";
    const incoming =
      isEntrante ||
      (Boolean(transaction.cuenta_destino_id) &&
        accountIds.has(transaction.cuenta_destino_id as string) &&
        !accountIds.has(transaction.cuenta_origen_id as string));

    const date = new Date(transaction.created_at);

    let recipient: string;
    if (incoming) {
      recipient =
        transaction.descripcion ||
        transaction.cuenta_origen_numero ||
        (transaction.cbu_origen ? `CBU ...${transaction.cbu_origen.slice(-6)}` : "Transferencia entrante");
    } else {
      recipient =
        transaction.cuenta_destino_numero ||
        (transaction.cbu_destino ? `CBU ...${transaction.cbu_destino.slice(-6)}` : "Cuenta destino");
    }

    return {
      id: transaction.id,
      type: incoming ? "in" : "out",
      title: transaction.tipo_transaccion_nombre || "Movimiento",
      recipient,
      amount: `${incoming ? "+" : "-"}${formatCurrency(Math.abs(amount))}`,
      date: new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(date),
      time: new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(date),
    } satisfies UserActivity;
  });
}

function isInternalProfile(authProfile: AuthenticatedUserProfile | null | undefined) {
  return Boolean(
    authProfile?.roles?.some((role) => INTERNAL_PORTAL_ROLES.has(String(role.nombre || "").toLowerCase()))
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
  const normalizedInitialPersonaId = sanitizePersonaId(initialPersonaId);
  const sanitizedPreferred = sanitizePersonaId(preferredPersonaId);
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

  // ── Auth profile ────────────────────────────────────────────────────────────
  const authProfileQuery = useAuthProfile({ enabled: isAuthReady });
  const authProfileUser = (authProfileQuery.data?.user ?? null) as AuthenticatedUserProfile | null;
  const canLoadInternalCatalogs = isInternalProfile(authProfileUser);

  // Si el usuario no es interno Y no tiene perfil completo, debe completar.
  const needsProfileCompletion = useMemo(() => {
    if (!authProfileUser) return false;
    if (canLoadInternalCatalogs) return false;
    return authProfileUser.perfil_completo === false;
  }, [authProfileUser, canLoadInternalCatalogs]);

  // ── Resolver qué persona mostrar ───────────────────────────────────────────
  const directPersonaId =
    sanitizePersonaId(selectedPersonaId) ||
    sanitizePersonaId(manualPersonaId) ||
    sanitizedPreferred;

  // Solo internos listan todas las personas, y solo si no hay direct.
  const shouldListPersonas = !directPersonaId && canLoadInternalCatalogs;
  const personasQuery = usePersonas({ enabled: isAuthReady && shouldListPersonas });

  const activePersonaId =
    directPersonaId ||
    authProfileUser?.persona_id ||
    personasQuery.data?.[0]?.id ||
    "";

  // ── Queries dependientes de la persona activa ──────────────────────────────
  // Se deshabilitan si no hay persona o si falta completar perfil (no tiene
  // sentido pegarle al backend hasta que el usuario complete los datos).
  const profileEnabled = isAuthReady && Boolean(activePersonaId) && !needsProfileCompletion;
  const personaFullQuery = usePersonaFull(profileEnabled ? activePersonaId : null);
  const transactionsQuery = usePersonaTransactions(profileEnabled ? activePersonaId : null);

  const profile = (personaFullQuery.data ?? null) as PersonaFullResponse | null;
  const transactions = transactionsQuery.data ?? [];

  // ── Catálogos (solo internos) ──────────────────────────────────────────────
  const catalogs = useInternalCatalogs({
    enabled: isAuthReady && canLoadInternalCatalogs && !needsProfileCompletion,
  });

  // ── Sincronizar selectedPersonaId con la persona realmente cargada ─────────
  useEffect(() => {
    if (profile?.persona.id) {
      setSelectedPersonaId(profile.persona.id);
      setManualPersonaId(profile.persona.id);
    }
  }, [profile?.persona.id]);

  // ── Derivados ──────────────────────────────────────────────────────────────
  const activities = useMemo(
    () => buildActivities(transactions, profile?.cuentas ?? []),
    [transactions, profile?.cuentas]
  );

  const warning = useMemo<string | null>(() => {
    if (needsProfileCompletion) return null;
    // Warnings técnicos de bootstrap (VITE_PERSONA_ID inválido, fallback a
    // persona del JWT, etc.) se silencian — el sistema sigue operando OK y
    // un cliente final no debería ver mensajes con jerga interna.
    if (catalogs.failed && canLoadInternalCatalogs) {
      return "Algunas funciones del panel administrativo no están disponibles momentáneamente.";
    }
    return null;
  }, [needsProfileCompletion, canLoadInternalCatalogs, catalogs.failed]);

  // ── Loading agregado ───────────────────────────────────────────────────────
  // Solo lo que bloquea el render principal: auth + perfil + transacciones.
  // Catálogos cargan en background.
  const loading =
    !isLoaded ||
    (isAuthReady &&
      (authProfileQuery.isLoading ||
        (profileEnabled && (personaFullQuery.isLoading || transactionsQuery.isLoading))));

  // ── Propagación de errores al banner del portal ────────────────────────────
  // Las queries reportan error individualmente; lo elevamos al estado global de
  // la página para mostrarlo en el banner. PROFILE_INCOMPLETE se trata distinto:
  // ya activa needsProfileCompletion y muestra un mensaje específico.
  useEffect(() => {
    const queryError =
      authProfileQuery.error || personaFullQuery.error || transactionsQuery.error;
    if (!queryError) return;

    if (queryError instanceof ApiError && queryError.code === "PROFILE_INCOMPLETE") {
      setError(queryError.message);
      return;
    }
    setError(queryError instanceof Error ? queryError.message : "No pudimos cargar tu información. Intentá refrescar la página.");
  }, [authProfileQuery.error, personaFullQuery.error, transactionsQuery.error, setError]);

  // ── API imperativa de refresh ──────────────────────────────────────────────
  // Mantiene la signatura previa para no romper consumidores. Internamente
  // invalida las queries y deja que TanStack Query refetchee lo activo.

  const refreshPersonaData = useCallback(
    async (personaId: string) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.personas.full(personaId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.transacciones.byPersona(personaId) }),
      ]);
    },
    [queryClient]
  );

  const refreshDestinatarios = useCallback(
    async (personaId: string) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.personas.full(personaId) });
    },
    [queryClient]
  );

  // loadPortal: si recibe personaIdOverride cambia la persona activa (lo cual
  // dispara nuevos fetchs por cambio de queryKey); si no, invalida todo lo
  // relacionado al portal para forzar refetch.
  const loadPortal = useCallback(
    async (
      personaIdOverride?: string,
      _options?: { skipCatalogReload?: boolean } // catálogos tienen staleTime alto, no necesitan flag
    ) => {
      setError(null);
      setSuccess(null);

      const override = sanitizePersonaId(personaIdOverride);
      if (override) {
        setSelectedPersonaId(override);
        setManualPersonaId(override);
        // El cambio de personaId dispara fetch automático vía queryKey.
        return;
      }

      // Reload generalizado: auth, persona activa, catálogos.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile }),
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
    accountTypes: catalogs.tiposCuenta,
    activities,
    authProfile: authProfileUser,
    banks: catalogs.bancos,
    loadPortal,
    loading,
    manualPersonaId,
    needsProfileCompletion,
    personas: personasQuery.data ?? [],
    profile,
    refreshDestinatarios,
    refreshPersonaData,
    roles: catalogs.roles,
    selectedPersonaId,
    setManualPersonaId,
    setSelectedPersonaId,
    transactionTypes: catalogs.tiposTransaccion,
    warning,
  };
}
