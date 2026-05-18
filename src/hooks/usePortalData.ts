import { useEffect, useState } from "react";
import { ApiError, setAccessTokenProvider } from "../lib/api/client";
import { formatCurrency } from "../lib/utils/currency";
import { listTiposCuenta } from "../features/cuentas/api/cuentas.api";
import type { AccountRecord, TipoCuentaRecord } from "../features/cuentas/types/cuentas.types";
import {
  getAuthenticatedUserProfile,
  getPersonaFull,
  getRoleOptions,
  getUserAudit,
  listPersonas,
  listRoles,
  sanitizePersonaId,
} from "../features/personas/api/personas.api";
import type {
  AuthenticatedUserProfile,
  PersonaFullResponse,
  PersonaOption,
  RoleRecord,
} from "../features/personas/types/personas.types";
import { getPersonaTransactions, listTiposTransaccion } from "../features/transacciones/api/transacciones.api";
import type { TipoTransaccionRecord, UserActivity } from "../features/transacciones/types/transacciones.types";

type GetTokenFn = () => Promise<string | null>;
const INTERNAL_PORTAL_ROLES = new Set(["admin", "operador", "auditor", "tesoreria"]);

function buildActivities(
  transactions: Awaited<ReturnType<typeof getPersonaTransactions>>,
  accounts: AccountRecord[]
) {
  const accountIds = new Set(accounts.map((account) => account.id));

  return transactions.slice(0, 8).map((transaction) => {
    const amount = Number(transaction.monto || 0);
    const incoming =
      Boolean(transaction.cuenta_destino_id) &&
      accountIds.has(transaction.cuenta_destino_id as string) &&
      !accountIds.has(transaction.cuenta_origen_id);
    const date = new Date(transaction.created_at);

    return {
      id: transaction.id,
      type: incoming ? "in" : "out",
      title: transaction.tipo_transaccion_nombre || "Movimiento",
      recipient: incoming
        ? transaction.cuenta_origen_numero || "Cuenta origen"
        : transaction.cuenta_destino_numero || "Cuenta destino",
      amount: `${incoming ? "+" : "-"}${formatCurrency(Math.abs(amount))}`,
      date: new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(date),
      time: new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(date),
    } satisfies UserActivity;
  });
}

async function safeCatalogLoad(canLoadInternalCatalogs: boolean) {
  if (!canLoadInternalCatalogs) {
    return {
      roles: [],
      accountTypes: [],
      transactionTypes: [],
      failed: false,
    };
  }

  const [rolesResult, accountTypesResult, transactionTypesResult] = await Promise.allSettled([
    listRoles(),
    listTiposCuenta(),
    listTiposTransaccion(),
  ]);

  return {
    roles: rolesResult.status === "fulfilled" ? rolesResult.value : [],
    accountTypes: accountTypesResult.status === "fulfilled" ? accountTypesResult.value : [],
    transactionTypes: transactionTypesResult.status === "fulfilled" ? transactionTypesResult.value : [],
    failed:
      rolesResult.status === "rejected" ||
      accountTypesResult.status === "rejected" ||
      transactionTypesResult.status === "rejected",
  };
}

function canListPersonas(authProfile: Awaited<ReturnType<typeof getAuthenticatedUserProfile>> | null) {
  return Boolean(
    authProfile?.user?.roles?.some((role) => INTERNAL_PORTAL_ROLES.has(String(role.nombre || "").toLowerCase()))
  );
}

function shouldCompleteProfile(authProfile: Awaited<ReturnType<typeof getAuthenticatedUserProfile>> | null) {
  if (!authProfile?.user) {
    return false;
  }

  if (canListPersonas(authProfile)) {
    return false;
  }

  return authProfile.user.perfil_completo === false;
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

  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [profile, setProfile] = useState<PersonaFullResponse | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [auditCount, setAuditCount] = useState(0);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [accountTypes, setAccountTypes] = useState<TipoCuentaRecord[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TipoTransaccionRecord[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState("");
  const [manualPersonaId, setManualPersonaId] = useState(normalizedInitialPersonaId);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [authProfile, setAuthProfile] = useState<AuthenticatedUserProfile | null>(null);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  async function loadPortal(personaIdOverride?: string) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const requestedPersonaId = sanitizePersonaId(personaIdOverride);
      const selectedId = sanitizePersonaId(selectedPersonaId);
      const manualId = sanitizePersonaId(manualPersonaId);
      const preferredId = sanitizePersonaId(preferredPersonaId);
      const directPersonaId = requestedPersonaId || selectedId || manualId || preferredId;
      const authProfile = await getAuthenticatedUserProfile().catch(() => null);

      if (shouldCompleteProfile(authProfile)) {
        setAuthProfile(authProfile?.user || null);
        setNeedsProfileCompletion(true);
        setPersonas([]);
        setProfile(null);
        setActivities([]);
        setAuditCount(0);
        setRoles([]);
        setAccountTypes([]);
        setTransactionTypes([]);
        setSelectedPersonaId("");
        setManualPersonaId("");
        setWarning(null);
        setError("Debes completar tu perfil antes de usar esta funcionalidad.");
        return;
      }

      const canLoadInternalCatalogs = canListPersonas(authProfile);
      const shouldListPersonas = !directPersonaId && canLoadInternalCatalogs;
      const personasResult = shouldListPersonas ? await listPersonas().catch(() => null) : null;
      const fallbackPersonaId =
        directPersonaId ||
        authProfile?.user?.persona_id ||
        personasResult?.[0]?.id ||
        "";

      if (!fallbackPersonaId) {
        throw new Error(
          "No pude obtener una persona inicial. Si `/api/personas` falla, coloca un `VITE_PERSONA_ID` valido en el .env."
        );
      }

      const nextProfile = await getPersonaFull(fallbackPersonaId);
      const transactions = await getPersonaTransactions(nextProfile.cuentas);
      const audits = nextProfile.usuario ? await getUserAudit(nextProfile.usuario.id) : [];
      const catalogs = await safeCatalogLoad(canLoadInternalCatalogs);
      const nextWarning =
        preferredPersonaId && !preferredId
          ? "Ignoré `VITE_PERSONA_ID` porque tenía una ruta en lugar de un UUID. Usa un `persona_id` real o déjalo vacío."
          : personasResult === null && Boolean(directPersonaId)
            ? "El portal se cargó usando un persona_id directo, sin depender del listado general."
            : authProfile?.user?.persona_id
              ? "El portal se cargó usando la persona asociada al usuario autenticado."
            : catalogs.failed
              ? "Algunos catalogos del backend devolvieron error. Las vistas de cliente siguen operativas y el panel admin cargara con menos opciones."
              : null;

      setPersonas(personasResult || []);
      setAuthProfile(authProfile?.user || null);
      setProfile(nextProfile);
      setActivities(buildActivities(transactions, nextProfile.cuentas));
      setAuditCount(audits.length);
      setSelectedPersonaId(nextProfile.persona.id);
      setManualPersonaId(nextProfile.persona.id);
      setRoles(catalogs.roles);
      setAccountTypes(catalogs.accountTypes);
      setTransactionTypes(catalogs.transactionTypes);
      setWarning(nextWarning);
      setNeedsProfileCompletion(false);
    } catch (nextError) {
      if (nextError instanceof ApiError && nextError.code === "PROFILE_INCOMPLETE") {
        const incompleteProfile = await getAuthenticatedUserProfile().catch(() => null);

        setAuthProfile(incompleteProfile?.user || null);
        setNeedsProfileCompletion(true);
        setPersonas([]);
        setProfile(null);
        setActivities([]);
        setAuditCount(0);
        setRoles([]);
        setAccountTypes([]);
        setTransactionTypes([]);
        setSelectedPersonaId("");
        setWarning(null);
        setError(nextError.message);
      } else {
        setNeedsProfileCompletion(false);
        setError(nextError instanceof Error ? nextError.message : "No se pudo cargar Orbital.");
        setWarning(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setAccessTokenProvider(null);
      setLoading(false);
      return;
    }

    setAccessTokenProvider(() => getToken());
    void loadPortal(normalizedInitialPersonaId || undefined);

    return () => {
      setAccessTokenProvider(null);
    };
  }, [getToken, isLoaded, isSignedIn, normalizedInitialPersonaId]);

  return {
    accountTypes,
    activities,
    authProfile,
    auditCount,
    loadPortal,
    loading,
    manualPersonaId,
    needsProfileCompletion,
    personas,
    profile,
    roles,
    selectedPersonaId,
    setManualPersonaId,
    setSelectedPersonaId,
    transactionTypes,
    warning,
  };
}
