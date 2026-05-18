import type { FormEvent } from "react";
import { createCuenta } from "../features/cuentas/api/cuentas.api";
import { createDestinatario, deleteDestinatario } from "../features/destinatarios/api/destinatarios.api";
import {
  assignPersonaRole,
  completeAuthenticatedUserProfile,
  createPersona,
  createUsuario,
  updatePersona,
  updateUsuario,
} from "../features/personas/api/personas.api";
import type { PersonaFullResponse } from "../features/personas/types/personas.types";
import { createTransfer } from "../features/transacciones/api/transacciones.api";
import type { CreateClientFormState } from "../features/admin/sections/AdminSection";
import type { ProfileFormState } from "../features/dashboard/sections/DashboardSection";
import type { RecipientFormState } from "../features/destinatarios/sections/RecipientsSection";
import type { CompleteProfileFormState } from "./usePortalForms";
import type { TransferFormState } from "../features/transacciones/sections/TransactionsSection";

interface UsePortalActionsParams {
  completeProfileForm: CompleteProfileFormState;
  createClientForm: CreateClientFormState;
  loadPortal: (personaIdOverride?: string) => Promise<void>;
  profile: PersonaFullResponse | null;
  profileForm: ProfileFormState;
  recipientForm: RecipientFormState;
  setCreateClientForm: React.Dispatch<React.SetStateAction<CreateClientFormState>>;
  setError: (value: string | null) => void;
  setRecipientForm: React.Dispatch<React.SetStateAction<RecipientFormState>>;
  setSubmitting: (value: boolean) => void;
  setSuccess: (value: string | null) => void;
  setTransferForm: React.Dispatch<React.SetStateAction<TransferFormState>>;
  transferForm: TransferFormState;
}

export function usePortalActions({
  completeProfileForm,
  createClientForm,
  loadPortal,
  profile,
  profileForm,
  recipientForm,
  setCreateClientForm,
  setError,
  setRecipientForm,
  setSubmitting,
  setSuccess,
  setTransferForm,
  transferForm,
}: UsePortalActionsParams) {
  async function handleCompleteProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await completeAuthenticatedUserProfile({
        nombre: completeProfileForm.nombre,
        apellido: completeProfileForm.apellido,
        dni: completeProfileForm.dni,
        email: completeProfileForm.email,
        telefono: completeProfileForm.telefono,
        fecha_nacimiento: completeProfileForm.fechaNacimiento,
      });

      setSuccess("Perfil completado correctamente.");
      await loadPortal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo completar el perfil.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await updatePersona(profile.persona.id, {
        nombre: profileForm.nombre,
        apellido: profileForm.apellido,
        email: profileForm.email,
        telefono: profileForm.telefono || null,
      });

      if (profile.usuario) {
        await updateUsuario(profile.usuario.id, { activo: profileForm.activo });
      }

      setSuccess("Perfil actualizado correctamente.");
      await loadPortal(profile.persona.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo actualizar el perfil.");
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
      await loadPortal(profile.persona.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo crear el destinatario.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!transferForm.tipoTransaccionId || !transferForm.cuentaOrigenId || !transferForm.monto) {
      setError("Completa tipo de transaccion, cuenta origen y monto.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await createTransfer({
        tipo_transaccion_id: transferForm.tipoTransaccionId,
        cuenta_origen_id: transferForm.cuentaOrigenId,
        cuenta_destino_id: transferForm.cuentaDestinoId || null,
        monto: Number(transferForm.monto),
        descripcion: transferForm.descripcion || null,
        estado: "completada",
      });

      setTransferForm((current) => ({
        ...current,
        monto: "",
        descripcion: "",
        cuentaDestinoId: "",
      }));
      setSuccess("Operacion registrada.");
      await loadPortal(profile?.persona.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo registrar la operacion.");
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
      await loadPortal(profile.persona.id);
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
      const persona = await createPersona({
        nombre: createClientForm.nombre,
        apellido: createClientForm.apellido,
        dni: createClientForm.dni,
        email: createClientForm.email,
        telefono: createClientForm.telefono || null,
      });

      await createUsuario({
        persona_id: persona.id,
        clerk_id: createClientForm.clerkId || `orbital_${createClientForm.dni}`,
        activo: true,
      });

      if (createClientForm.roleId) {
        await assignPersonaRole({ persona_id: persona.id, rol_id: createClientForm.roleId });
      }

      if (createClientForm.tipoCuentaId && createClientForm.numeroCuenta && createClientForm.cbu) {
        await createCuenta({
          persona_id: persona.id,
          tipo_cuenta_id: createClientForm.tipoCuentaId,
          numero_cuenta: createClientForm.numeroCuenta,
          cbu: createClientForm.cbu,
          saldo: Number(createClientForm.saldo || 0),
          activa: true,
        });
      }

      setCreateClientForm({
        nombre: "",
        apellido: "",
        dni: "",
        email: "",
        telefono: "",
        clerkId: "",
        roleId: "",
        tipoCuentaId: "",
        numeroCuenta: "",
        cbu: "",
        saldo: "0",
      });
      setSuccess("Cliente creado en Orbital.");
      await loadPortal(persona.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo crear el cliente.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    handleCompleteProfile,
    handleCreateClient,
    handleProfileSave,
    handleRecipientCreate,
    handleRecipientDelete,
    handleTransfer,
  };
}
