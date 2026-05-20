import { useState, type FormEvent } from "react";
import { createDestinatario, deleteDestinatario } from "../features/destinatarios/api/destinatarios.api";
import {
  bulkSyncAccounts,
  completeAuthenticatedUserProfile,
  registerPersonFromAdmin,
  syncCentralBankAccount,
} from "../features/personas/api/personas.api";
import type { PersonaFullResponse } from "../features/personas/types/personas.types";
import { createTransfer, syncIncomingTransactions } from "../features/transacciones/api/transacciones.api";
import type { SyncIncomingResult } from "../features/transacciones/api/transacciones.api";
import { ApiError } from "../lib/api/client";
import type { CreateClientFormState } from "../features/admin/sections/AdminSection";
import type { RecipientFormState } from "../features/destinatarios/sections/RecipientsSection";
import type { CompleteProfileFormState } from "./usePortalForms";
import type { TransferFormState } from "../features/transacciones/sections/TransactionsSection";

interface UsePortalActionsParams {
  completeProfileForm: CompleteProfileFormState;
  createClientForm: CreateClientFormState;
  loadPortal: (personaIdOverride?: string) => Promise<void>;
  profile: PersonaFullResponse | null;
  recipientForm: RecipientFormState;
  refreshDestinatarios: (personaId: string) => Promise<void>;
  refreshPersonaData: (personaId: string) => Promise<void>;
  setCreateClientForm: React.Dispatch<React.SetStateAction<CreateClientFormState>>;
  setError: (value: string | null) => void;
  setRecipientForm: React.Dispatch<React.SetStateAction<RecipientFormState>>;
  setSubmitting: (value: boolean) => void;
  setSuccess: (value: string | null) => void;
  setTransferForm: React.Dispatch<React.SetStateAction<TransferFormState>>;
  transferForm: TransferFormState;
}

export interface SyncState {
  syncingAccountId: string | null;
  bulkSyncing: boolean;
}

export function usePortalActions({
  completeProfileForm,
  createClientForm,
  loadPortal,
  profile,
  recipientForm,
  refreshDestinatarios,
  refreshPersonaData,
  setCreateClientForm,
  setError,
  setRecipientForm,
  setSubmitting,
  setSuccess,
  setTransferForm,
  transferForm,
}: UsePortalActionsParams) {
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [syncingIncoming, setSyncingIncoming] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncIncomingResult | null>(null);
  async function handleCompleteProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await completeAuthenticatedUserProfile({
        nombre: completeProfileForm.nombre,
        apellido: completeProfileForm.apellido,
        dni: completeProfileForm.dni,
        email: completeProfileForm.email,
        telefono: completeProfileForm.telefono,
        fecha_nacimiento: completeProfileForm.fechaNacimiento,
      });

      const cbuMsg = result.centralBank?.cbu
        ? ` Tu CBU Brocoly asignado: ${result.centralBank.cbu}${result.centralBank.alias ? ` (alias: ${result.centralBank.alias})` : ""}.`
        : "";
      setSuccess(`Perfil completado correctamente.${cbuMsg}`);
      await loadPortal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo completar el perfil.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecipientCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await createDestinatario({
        persona_id: profile.persona.id,
        alias: recipientForm.alias || null,
        cbu_externo: recipientForm.cbu,
        banco_externo: recipientForm.banco || null,
      });

      setRecipientForm({ alias: "", cbu: "", banco: "" });
      setSuccess("Destinatario agregado.");
      await refreshDestinatarios(profile.persona.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo crear el destinatario.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) {
      setError("No pude resolver el perfil actual para transferir.");
      return;
    }

    if (!transferForm.cbuDestino) {
      setError("Debes verificar el CBU o alias destino en el Banco Central antes de transferir.");
      return;
    }

    const importe = Number(transferForm.monto);
    if (!transferForm.monto || importe <= 0 || isNaN(importe)) {
      setError("Ingresa un monto válido mayor a cero.");
      return;
    }

    const originAccount = profile.cuentas.find((account) => account.id === transferForm.cuentaOrigenId);

    if (!originAccount?.cbu) {
      setError("No pude resolver el CBU de la cuenta origen.");
      return;
    }

    if (originAccount.banco_central_registrada === false) {
      setError(
        "La cuenta origen no está registrada en el Banco Central Brocoly. Un administrador debe sincronizarla antes de poder transferir."
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await createTransfer({
        cbuOrigen: originAccount.cbu,
        cbuDestino: transferForm.cbuDestino,
        importe,
        saldoOrigen: Number(originAccount.saldo || 0),
      });

      // HTTP 201 = aprobada por Brocoly
      setTransferForm((current) => ({ ...current, monto: "", descripcion: "", cbuDestino: "" }));
      setSuccess("Transferencia aprobada por el Banco Central Brocoly.");
      await refreshPersonaData(profile.persona.id);
    } catch (nextError) {
      // Limpiar monto para que el usuario re-intente conscientemente
      setTransferForm((current) => ({ ...current, monto: "" }));

      if (nextError instanceof ApiError) {
        if (nextError.status === 422) {
          // Brocoly rechazó por saldo insuficiente; la transacción quedó registrada como rechazada
          setError("Saldo insuficiente. El Banco Central registró la transferencia como rechazada.");
          await refreshPersonaData(profile.persona.id);
        } else if (nextError.status === 429) {
          setError("El Banco Central está limitando las solicitudes. Espera unos segundos e intenta de nuevo.");
        } else if (nextError.status === 502 || nextError.status === 503) {
          setError("No se pudo conectar con el Banco Central. Verifica tu conexión e intenta de nuevo.");
        } else if (nextError.status === 400 && nextError.message.includes("saldoOrigen")) {
          setError("El saldo de tu cuenta no está actualizado. Recarga el portal e intenta de nuevo.");
          await refreshPersonaData(profile.persona.id);
        } else {
          setError(nextError.message || "No se pudo registrar la transferencia.");
        }
      } else {
        setError(nextError instanceof Error ? nextError.message : "No se pudo registrar la transferencia.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecipientDelete(recipientId: string) {
    if (!profile) return;

    setSubmitting(true);
    setError(null);

    try {
      await deleteDestinatario(recipientId);
      setSuccess("Destinatario eliminado.");
      await refreshDestinatarios(profile.persona.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo eliminar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await registerPersonFromAdmin({
        nombre: createClientForm.nombre,
        apellido: createClientForm.apellido,
        dni: createClientForm.dni,
        email: createClientForm.email || undefined,
        telefono: createClientForm.telefono || undefined,
        environment: createClientForm.environment,
      });

      setCreateClientForm({
        nombre: "",
        apellido: "",
        dni: "",
        email: "",
        telefono: "",
        environment: createClientForm.environment,
      });
      const brocolyCbu = result.centralBankPerson?.cbu || result.cuenta.cbu;
      setSuccess(
        `${result.message} CBU Brocoly: ${brocolyCbu}${result.cuenta.cbu && result.cuenta.cbu !== brocolyCbu ? ` | CBU local: ${result.cuenta.cbu}` : ""}${result.cuenta.alias ? ` | Alias: ${result.cuenta.alias}` : ""}`
      );
      await loadPortal(result.persona.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo crear el cliente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSyncIncoming() {
    if (!profile || syncingIncoming) return;

    setSyncingIncoming(true);
    setLastSyncResult(null);

    try {
      const result = await syncIncomingTransactions();
      setLastSyncResult(result);
      if (result.synced > 0) {
        setSuccess(`Se registraron ${result.synced} transferencia${result.synced !== 1 ? "s" : ""} entrante${result.synced !== 1 ? "s" : ""} nueva${result.synced !== 1 ? "s" : ""}.`);
        await refreshPersonaData(profile.persona.id);
      }
    } catch {
      // best-effort: no mostramos error para no alarmar al usuario
    } finally {
      setSyncingIncoming(false);
    }
  }

  async function handleSyncAccount(accountId: string) {
    if (!profile || syncingAccountId) return;

    setSyncingAccountId(accountId);
    setError(null);
    setSuccess(null);

    try {
      const result = await syncCentralBankAccount(accountId, "test");
      const warnings = result.warnings?.join(" ") || "";
      setSuccess(`Cuenta sincronizada con Brocoly. CBU: ${result.account.cbu}${warnings ? ` — ${warnings}` : ""}`);
      await refreshPersonaData(profile.persona.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo sincronizar la cuenta.");
    } finally {
      setSyncingAccountId(null);
    }
  }

  async function handleBulkSync() {
    if (!profile || bulkSyncing) return;

    setBulkSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await bulkSyncAccounts({ environment: "test" });
      setSuccess(
        `Sincronización completada: ${result.successCount} exitosas, ${result.errorCount} con error.`
      );
      await refreshPersonaData(profile.persona.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo ejecutar la sincronización masiva.");
    } finally {
      setBulkSyncing(false);
    }
  }

  return {
    bulkSyncing,
    handleCompleteProfile,
    handleCreateClient,
    handleRecipientCreate,
    handleRecipientDelete,
    handleSyncAccount,
    handleBulkSync,
    handleSyncIncoming,
    handleTransfer,
    lastSyncResult,
    syncingAccountId,
    syncingIncoming,
  };
}
