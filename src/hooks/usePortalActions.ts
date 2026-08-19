import { useState, type FormEvent } from "react";
import {
  sincronizarCuentasEnLote,
  completarPerfilDeUsuarioAutenticado,
  registrarPersonaDesdeAdmin,
  sincronizarCuentaConCentral,
} from "../features/personas/api/personas.api";
import type { PersonaCompleta } from "../features/personas/types/personas.types";
import type { SyncIncomingResult } from "../features/transacciones/api/transacciones.api";
import type { Transaccion } from "../features/transacciones/types/transacciones.types";
import { ApiError } from "../lib/api/client";
import {
  useCrearDestinatario,
  useCrearTransferencia,
  useEliminarDestinatario,
  useSyncIncoming,
} from "../lib/queries";
import type {
  FormularioCompletarPerfil,
  FormularioDestinatario,
  FormularioTransferencia,
} from "../lib/schemas";
import type { CreateClientFormState } from "../features/admin/sections/AdminSection";

interface UsePortalActionsParams {
  createClientForm: CreateClientFormState;
  cargarPortal: (personaIdOverride?: string) => Promise<void>;
  perfil: PersonaCompleta | null;
  refrescarDestinatarios: (personaId: string) => Promise<void>;
  refrescarDatosDePersona: (personaId: string) => Promise<void>;
  setCreateClientForm: React.Dispatch<React.SetStateAction<CreateClientFormState>>;
  setError: (value: string | null) => void;
  setSubmitting: (value: boolean) => void;
  setSuccess: (value: string | null) => void;
}

export interface SyncState {
  idCuentaSincronizando: string | null;
  bulkSyncing: boolean;
}

export function usePortalActions({
  createClientForm,
  cargarPortal,
  perfil,
  refrescarDatosDePersona,
  setCreateClientForm,
  setError,
  setSubmitting,
  setSuccess,
}: UsePortalActionsParams) {
  const [idCuentaSincronizando, setIdCuentaSincronizando] = useState<string | null>(null);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncIncomingResult | null>(null);
  // Comprobante de la última transferencia exitosa (alimenta el modal estilo banco).
  const [comprobanteTransferencia, setComprobanteTransferencia] = useState<Transaccion | null>(null);

  // Counter que se incrementa después de cada submit exitoso. Las sections lo
  // observan vía prop `resetSignal` para limpiar el form RHF interno. Tener
  // un signal único por section asegura que un submit a "destinatario" no
  // resetea el form de "transferir".
  const [contadorResetDestinatario, setContadorResetDestinatario] = useState(0);
  const [contadorResetTransferencia, setContadorResetTransferencia] = useState(0);

  // Mutations: encapsulan loading, error, invalidación automática de queries.
  const personaId = perfil?.persona.id ?? null;
  const mutationCrearTransferencia = useCrearTransferencia(personaId);
  const createDestinatarioMutation = useCrearDestinatario(personaId);
  const deleteDestinatarioMutation = useEliminarDestinatario(personaId);
  const syncIncomingMutation = useSyncIncoming(personaId);

  const syncingIncoming = syncIncomingMutation.isPending;

  async function manejarCompletarPerfil(values: FormularioCompletarPerfil) {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await completarPerfilDeUsuarioAutenticado({
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
      await cargarPortal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo completar el perfil.");
    } finally {
      setSubmitting(false);
    }
  }

  async function manejarCrearDestinatario(values: FormularioDestinatario) {
    if (!perfil) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await createDestinatarioMutation.mutateAsync({
        persona_id: perfil.persona.id,
        alias: values.alias?.trim() ? values.alias.trim() : null,
        cbu_externo: values.cbu,
        banco_externo: values.banco?.trim() ? values.banco.trim() : null,
      });
      setContadorResetDestinatario((n) => n + 1);
      setSuccess("Destinatario agregado.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo crear el destinatario.");
    } finally {
      setSubmitting(false);
    }
  }

  async function manejarTransferir(values: FormularioTransferencia) {
    if (!perfil) {
      setError("No pude resolver el perfil actual para transferir.");
      return;
    }

    const cuentaOrigen = perfil.cuentas.find((cuenta) => cuenta.id === values.cuentaOrigenId);

    if (!cuentaOrigen?.cbu) {
      setError("No pude resolver el CBU de la cuenta origen.");
      return;
    }

    if (cuentaOrigen.banco_central_registrada === false) {
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
      const created = await mutationCrearTransferencia.mutateAsync({
        cbuOrigen: cuentaOrigen.cbu,
        cbuDestino: values.cbuDestino,
        importe,
        saldoOrigen: Number(cuentaOrigen.saldo || 0),
        idempotencyKey,
      });

      setContadorResetTransferencia((n) => n + 1);
      // En vez del banner verde, mostramos un comprobante estilo banco.
      setComprobanteTransferencia(created);
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

  async function manejarEliminarDestinatario(destinatarioId: string) {
    if (!perfil) return;

    setSubmitting(true);
    setError(null);

    try {
      await deleteDestinatarioMutation.mutateAsync(destinatarioId);
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
      const result = await registrarPersonaDesdeAdmin({
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
      await cargarPortal(result.persona.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo crear el cliente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSyncIncoming() {
    if (!perfil || syncingIncoming) return;

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

  async function manejarSincronizarCuenta(idCuenta: string) {
    if (!perfil || idCuentaSincronizando) return;

    setIdCuentaSincronizando(idCuenta);
    setError(null);
    setSuccess(null);

    try {
      const result = await sincronizarCuentaConCentral(idCuenta, "test");
      const warnings = result.warnings?.join(" ") || "";
      setSuccess(`Cuenta habilitada para transferencias interbancarias. CBU: ${result.cuenta.cbu}${warnings ? ` — ${warnings}` : ""}`);
      await refrescarDatosDePersona(perfil.persona.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo sincronizar la cuenta.");
    } finally {
      setIdCuentaSincronizando(null);
    }
  }

  async function handleBulkSync() {
    if (!perfil || bulkSyncing) return;

    setBulkSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await sincronizarCuentasEnLote({ environment: "test" });
      setSuccess(
        `Sincronización completada: ${result.successCount} exitosas, ${result.errorCount} con error.`
      );
      await refrescarDatosDePersona(perfil.persona.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo ejecutar la sincronización masiva.");
    } finally {
      setBulkSyncing(false);
    }
  }

  return {
    bulkSyncing,
    manejarCompletarPerfil,
    handleCreateClient,
    manejarCrearDestinatario,
    manejarEliminarDestinatario,
    manejarSincronizarCuenta,
    handleBulkSync,
    handleSyncIncoming,
    manejarTransferir,
    lastSyncResult,
    contadorResetDestinatario,
    idCuentaSincronizando,
    syncingIncoming,
    contadorResetTransferencia,
    comprobanteTransferencia,
    setComprobanteTransferencia,
  };
}
