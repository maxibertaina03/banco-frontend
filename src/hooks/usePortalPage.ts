import { useAuth } from "@clerk/clerk-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PREFERRED_PERSONA_ID } from "../lib/constants/portal";
import { sanitizePersonaId } from "../features/personas/api/personas.api";
import type { PortalRole } from "../features/personas/types/personas.types";
import type { TransactionRecord } from "../features/transacciones/types/transacciones.types";
import type { Section } from "../pages/portal.config";
import { useNotifications } from "./useNotifications";
import { usePersonaTransactions } from "../lib/queries";
import { usePortalActions } from "./usePortalActions";
import { usePortalData } from "./usePortalData";
import { usePortalForms } from "./usePortalForms";
import { getRoleOptions, getRoleScope } from "../features/personas/api/personas.api";
import { formatCurrency } from "../lib/utils/currency";

export function usePortalPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const initialPersonaId = sanitizePersonaId(PREFERRED_PERSONA_ID);

  const [activeRole, setActiveRole] = useState<PortalRole>("cliente");
  const [section, setSection] = useState<Section>("dashboard");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    accountTypes,
    activities,
    authProfile,
    banks,
    loadPortal,
    loading,
    manualPersonaId,
    needsProfileCompletion,
    personas,
    profile,
    refreshDestinatarios,
    refreshPersonaData,
    roles,
    selectedPersonaId,
    setManualPersonaId,
    setSelectedPersonaId,
    transactionTypes,
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
    selectedAccountForAlias,
    setCreateClientForm,
    setSelectedAccountForAlias,
  } = usePortalForms();

  const roleOptions = useMemo<PortalRole[]>(() => (profile ? getRoleOptions(profile) : ["cliente"]), [profile]);
  const scope = getRoleScope(activeRole);
  const totalBalance = useMemo(
    () => profile?.cuentas.reduce((sum, account) => sum + Number(account.saldo || 0), 0) || 0,
    [profile]
  );

  const personaTransactionsQuery = usePersonaTransactions(profile?.persona.id);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    personaId: profile?.persona.id,
    transactions: personaTransactionsQuery.data ?? [],
    accounts: profile?.cuentas ?? [],
  });

  const {
    bulkSyncing,
    handleBulkSync,
    handleCompleteProfile,
    handleCreateClient,
    handleRecipientCreate,
    handleRecipientDelete,
    handleSyncAccount,
    handleSyncIncoming,
    handleTransfer,
    lastSyncResult,
    recipientResetSignal,
    syncingAccountId,
    syncingIncoming,
    transferResetSignal,
    transferReceipt,
    setTransferReceipt,
  } = usePortalActions({
    createClientForm,
    loadPortal,
    profile,
    refreshDestinatarios,
    refreshPersonaData,
    setCreateClientForm,
    setError,
    setSubmitting,
    setSuccess,
  });

  // Detalle de un movimiento: al tocar uno en la lista, lo buscamos en las
  // transacciones que ya tenemos cargadas (mismas que alimentan notificaciones).
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);
  const openTransactionDetail = useCallback(
    (transactionId: string) => {
      const found = (personaTransactionsQuery.data ?? []).find((tx) => tx.id === transactionId);
      if (found) setSelectedTransaction(found);
    },
    [personaTransactionsQuery.data],
  );

  useEffect(() => {
    if (scope === "user" && section === "admin") {
      setSection("dashboard");
    }
  }, [scope, section]);

  const handleGoToAccounts = useCallback(() => setSection("accounts"), []);
  const handleGoToActivity = useCallback(() => setSection("transactions"), []);
  const handleGoToContacts = useCallback(() => setSection("recipients"), []);
  const handleGoToTransactions = useCallback(() => setSection("transactions"), []);
  const handleLoadPersona = useCallback((personaId?: string) => void loadPortal(personaId), [loadPortal]);
  const handleCopyCbu = useCallback(() => {
    const cbu = profile?.cuentas[0]?.cbu;
    if (cbu) {
      void navigator.clipboard.writeText(cbu);
      setSuccess("CBU copiado al portapapeles.");
    }
  }, [profile?.cuentas]);
  const handleCopyAlias = useCallback(() => {
    const alias = profile?.cuentas[0]?.alias;
    if (alias) {
      void navigator.clipboard.writeText(alias);
      setSuccess("Alias copiado al portapapeles.");
    }
  }, [profile?.cuentas]);
  const handleIncome = useCallback(() => void loadPortal(profile?.persona.id), [loadPortal, profile?.persona.id]);
  const handleAliasUpdated = useCallback(() => {
    setSuccess("Alias actualizado correctamente.");
    setSelectedAccountForAlias(null);
    void loadPortal(profile?.persona.id);
  }, [loadPortal, profile?.persona.id, setSelectedAccountForAlias]);
  const handleSyncAccountCb = useCallback((accountId: string) => void handleSyncAccount(accountId), [handleSyncAccount]);
  const handleBulkSyncCb = useCallback(() => void handleBulkSync(), [handleBulkSync]);
  const handleSyncIncomingCb = useCallback(() => void handleSyncIncoming(), [handleSyncIncoming]);
  const handleRecipientDeleteCb = useCallback(
    (recipient: { id: string }) => void handleRecipientDelete(recipient.id),
    [handleRecipientDelete],
  );
  const handleAccountSynced = useCallback(
    async () => { await loadPortal(profile?.persona.id, { skipCatalogReload: true }); },
    [loadPortal, profile?.persona.id],
  );

  return {
    // State
    activeRole,
    setActiveRole,
    section,
    setSection,
    submitting,
    error,
    setError,
    success,
    setSuccess,

    // Portal data
    accountTypes,
    activities,
    authProfile,
    banks,
    loading,
    manualPersonaId,
    needsProfileCompletion,
    personas,
    profile,
    roles,
    selectedPersonaId,
    transactionTypes,
    warning,

    // Computed
    roleOptions,
    scope,
    totalBalance,

    // Notifications
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,

    // Forms
    createClientForm,
    setCreateClientForm,
    selectedAccountForAlias,
    setSelectedAccountForAlias,

    // Actions
    bulkSyncing,
    lastSyncResult,
    recipientResetSignal,
    syncingAccountId,
    syncingIncoming,
    transferResetSignal,

    // Comprobante de transferencia + detalle de movimiento
    transferReceipt,
    setTransferReceipt,
    selectedTransaction,
    setSelectedTransaction,
    openTransactionDetail,

    // Handlers
    handleGoToAccounts,
    handleGoToActivity,
    handleGoToContacts,
    handleGoToTransactions,
    handleLoadPersona,
    handleCopyCbu,
    handleCopyAlias,
    handleIncome,
    handleAliasUpdated,
    handleSyncAccountCb,
    handleBulkSyncCb,
    handleSyncIncomingCb,
    handleRecipientDeleteCb,
    handleAccountSynced,
    handleCompleteProfile,
    handleCreateClient,
    handleRecipientCreate,
    handleRecipientDelete,
    handleTransfer,

    // Utilities
    setManualPersonaId,
    setSelectedPersonaId,
    refreshDestinatarios,
    refreshPersonaData,
    loadPortal,
  };
}
