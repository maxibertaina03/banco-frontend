import { useEffect, useState } from "react";
import type { CreateClientFormState } from "../features/admin/sections/AdminSection";
import type { AuthenticatedUserProfile } from "../features/personas/types/personas.types";
import type { RecipientFormState } from "../features/destinatarios/sections/RecipientsSection";
import type { PersonaFullResponse } from "../features/personas/types/personas.types";
import type { TransferFormState } from "../features/transacciones/sections/TransactionsSection";

export interface CompleteProfileFormState {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
}

export function usePortalForms(
  profile: PersonaFullResponse | null,
  authProfile: AuthenticatedUserProfile | null
) {
  const [, setLegacyProfileForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    activo: true,
  });
  const [recipientForm, setRecipientForm] = useState<RecipientFormState>({
    alias: "",
    cbu: "",
    banco: "",
  });
  const [transferForm, setTransferForm] = useState<TransferFormState>({
    cuentaOrigenId: "",
    cbuDestino: "",
    monto: "",
    descripcion: "",
  });
  const [createClientForm, setCreateClientForm] = useState<CreateClientFormState>({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
    environment: "test",
  });
  const [selectedAccountForAlias, setSelectedAccountForAlias] = useState<string | null>(null);
  const [completeProfileForm, setCompleteProfileForm] = useState<CompleteProfileFormState>({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
    fechaNacimiento: "",
  });

  useEffect(() => {
    if (!profile) {
      return;
    }

    setLegacyProfileForm({
      nombre: profile.persona.nombre,
      apellido: profile.persona.apellido,
      email: profile.persona.email,
      telefono: profile.persona.telefono || "",
      activo: profile.usuario?.activo ?? true,
    });
  }, [profile]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setTransferForm((current) => ({
      ...current,
      cuentaOrigenId: current.cuentaOrigenId || profile.cuentas[0]?.id || "",
    }));
  }, [profile]);

  useEffect(() => {
    if (!authProfile) {
      return;
    }

    setCompleteProfileForm({
      nombre: authProfile.nombre || "",
      apellido: authProfile.apellido || "",
      dni: authProfile.dni || "",
      email: authProfile.email || "",
      telefono: authProfile.telefono || "",
      fechaNacimiento: authProfile.fecha_nacimiento || "",
    });
  }, [authProfile]);

  return {
    completeProfileForm,
    createClientForm,
    recipientForm,
    selectedAccountForAlias,
    setCompleteProfileForm,
    setCreateClientForm,
    setRecipientForm,
    setSelectedAccountForAlias,
    setTransferForm,
    transferForm,
  };
}
