import { useState, type FormEvent } from "react";
import {
  bulkSyncAccounts,
  completeAuthenticatedUserProfile,
  registerPersonFromAdmin,
  syncCentralBankAccount,
} from "../features/personas/api/personas.api";
import type { PersonaFullResponse } from "../features/personas/types/personas.types";
import type { SyncIncomingResult } from "../features/transacciones/api/transacciones.api";
import { ApiError } from "../lib/api/client";
import {
  useCreateDestinatario,
  useCreateTransfer,
  useDeleteDestinatario,
  useSyncIncoming,
} from "../lib/queries";
import type {
  CompleteProfileFormValues,
  RecipientFormValues,
  TransferFormValues,
} from "../lib/schemas";
import type { CreateClientFormState } from "../features/admin/sections/AdminSection";

interface UsePortalActionsParams {
  createClientForm: CreateClientFormState;
  loadPortal: (personaIdOverride?: string) => Promise<void>;
  profile: PersonaFullResponse | null;
  refreshDestinatarios: (personaId: string) => Promise<void>;
  refreshPersonaData: (personaId: string) => Promise<void>;
  setCreateClientForm: React.Dispatch<React.SetStateAction<CreateClientFormState>>;
  setError: (value: string | null) => void;
  setSubmitting: (value: boolean) => void;
  setSuccess: (value: string | null) => void;
}

export interface SyncState {
  syncingAccountId: string | null;
  bulkSyncing: boolean;
}

export function usePortalActions({
  createClientForm,
  loadPortal,
  profile,
  refreshPersonaData,
  setCreateClientForm,
  setError,
  setSubmitting,
  setSuccess,
}: UsePortalActionsParams) {
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncIncomingResult | null>(null);

  // Counter que se incrementa después de cada submit exitoso. Las sections lo
  // observan vía prop `resetSignal` para limpiar el form RHF interno. Tener
  // un signal único por section asegura que un submit a "destinatario" no
  // resetea el form de "transferir".
  const [recipientResetSignal, setRecipientResetSignal] = useState(0);
  const [transferResetSignal, setTransferResetSignal] = useState(0);

  // Mutations: encapsulan loading, error, invalidación automática de queries.
  const personaId = profile?.persona.id ?? null;
  const createTransferMutation = useCreateTransfer(personaId);
  const createDestinatarioMutation = useCreateDestinatario(personaId);
  const deleteDestinatarioMutation = useDeleteDestinatario(personaId);
  const syncIncomingMutation = useSyncIncoming(personaId);

  const syncingIncoming = syncIncomingMutation.isPending;

  async function handleCompleteProfile(values: CompleteProfileFormValues) {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await completeAuthenticatedUserProfile({
        nombre: values.nombre,
        apellido: values.apellido,
        dni: values.dni,
        email: values.email,
        telefono: values.telefono,
        fecha_nacimiento: values.fechaNacimiento,
      });

      const cbuMsg = result.centralBank?.cbu
        ? ` Te asignamos el CBU ${result.centralBank.cbu}${result.centralBank.alias ? ` (alias: ${result.centralBank.alias})` : ""}.`
        : "";
      setSuccess(`Perfil completado correctamente.${cbuMsg}`);
      await loadPortal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo completar el perfil.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecipientCreate(values: RecipientFormValues) {
    if (!profile) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await createDestinatarioMutation.mutateAsync({
        persona_id: profile.persona.id,
        alias: values.alias?.trim() ? values.alias.trim() : null,
        cbu_externo: values.cbu,
        banco_externo: values.banco?.trim() ? values.banco.trim() : null,
      });
      setRecipientResetSignal((n) => n + 1);
      setSuccess("Destinatario agregado.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo crear el destinatario.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTransfer(values: TransferFormValues) {
    if (!profile) {
      setError("No pude resolver el perfil actual para transferir.");
      return;
    }

    const originAccount = profile.cuentas.find((account) => account.id === values.cuentaOrigenId);

    if (!originAccount?.cbu) {
      setError("No pude resolver el CBU de la cuenta origen.");
      return;
    }

    if (originAccount.banco_central_registrada === false) {
      setError(
        "La cuenta origen todavía no está habilitada para transferencias a otros bancos. Comunicate con el banco para activarla."
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const importe = Number(values.monto);
    // UUID por intento de transferencia: si el request termina mal (red, etc)
    // y el usuario reintenta MIENTRAS el form está bloqueado, no hay riesgo.
    // Si el frontend nunca recibe la respuesta y el usuario navega a otro
    // lado, el siguiente intento generará un UUID nuevo — aceptable trade-off.
    const idempotencyKey = crypto.randomUUID();

    try {
      await createTransferMutation.mutateAsync({
        cbuOrigen: originAccount.cbu,
        cbuDestino: values.cbuDestino,
        importe,
        saldoOrigen: Number(originAccount.saldo || 0),
        idempotencyKey,
      });

      setTransferResetSignal((n) => n + 1);
      setSuccess("Transferencia realizada con éxito.");
    } catch (nextError) {
      // No reseteamos el form completo: el usuario probablemente quiera ajustar el monto.
      if (nextError instanceof ApiError) {
        if (nextError.status === 422) {
          setError("Saldo insuficiente. La transferencia fue rechazada.");
        } else if (nextError.status === 429) {
          setError("Estás haciendo demasiadas operaciones seguidas. Esperá unos segundos e intentá de nuevo.");
        } else if (nextError.status === 502 || nextError.status === 503) {
          setError("Servicio momentáneamente no disponible. Verificá tu conexión e intentá nuevamente.");
        } else if (nextError.status === 400 && nextError.message.includes("saldoOrigen")) {
          setError("El saldo de tu cuenta cambió. Refrescá la pantalla e intentá de nuevo.");
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
      await deleteDestinatarioMutation.mutateAsync(recipientId);
      setSuccess("Destinatario eliminado.");
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
      const cbuAsignado = result.centralBankPerson?.cbu || result.cuenta.cbu;
      setSuccess(
        `${result.message} CBU: ${cbuAsignado}${result.cuenta.alias ? ` · Alias: ${result.cuenta.alias}` : ""}`
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

    setLastSyncResult(null);

    try {
      const result = await syncIncomingMutation.mutateAsync();
      setLastSyncResult(result);
      if (result.synced > 0) {
        setSuccess(`Se registraron ${result.synced} transferencia${result.synced !== 1 ? "s" : ""} entrante${result.synced !== 1 ? "s" : ""} nueva${result.synced !== 1 ? "s" : ""}.`);
      }
    } catch {
      // best-effort: no mostramos error para no alarmar al usuario
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
      setSuccess(`Cuenta habilitada para transferencias interbancarias. CBU: ${result.account.cbu}${warnings ? ` — ${warnings}` : ""}`);
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
    recipientResetSignal,
    syncingAccountId,
    syncingIncoming,
    transferResetSignal,
  };
}
