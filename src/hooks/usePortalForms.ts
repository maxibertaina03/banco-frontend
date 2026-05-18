import { useEffect, useState } from "react";
import type { CreateClientFormState } from "../features/admin/sections/AdminSection";
import type { AuthenticatedUserProfile } from "../features/personas/types/personas.types";
import type { ProfileFormState } from "../features/dashboard/sections/DashboardSection";
import type { RecipientFormState } from "../features/destinatarios/sections/RecipientsSection";
import type { PersonaFullResponse } from "../features/personas/types/personas.types";
import type { TipoTransaccionRecord } from "../features/transacciones/types/transacciones.types";
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
  transactionTypes: TipoTransaccionRecord[],
  authProfile: AuthenticatedUserProfile | null
) {
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
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
    tipoTransaccionId: "",
    cuentaOrigenId: "",
    cuentaDestinoId: "",
    monto: "",
    descripcion: "",
  });
  const [createClientForm, setCreateClientForm] = useState<CreateClientFormState>({
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

    setProfileForm({
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
      tipoTransaccionId: current.tipoTransaccionId || transactionTypes[0]?.id || "",
      cuentaOrigenId: current.cuentaOrigenId || profile.cuentas[0]?.id || "",
    }));
  }, [profile, transactionTypes]);

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
    profileForm,
    recipientForm,
    selectedAccountForAlias,
    setCompleteProfileForm,
    setCreateClientForm,
    setProfileForm,
    setRecipientForm,
    setSelectedAccountForAlias,
    setTransferForm,
    transferForm,
  };
}
