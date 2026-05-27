import { useState } from "react";
import type { CreateClientFormState } from "../features/admin/sections/AdminSection";

// Después de la migración a react-hook-form, los forms de "recipient",
// "transfer" y "complete profile" viven dentro de su section con RHF. Este
// hook ahora solo encapsula los pocos forms que aún usan estado global del
// portal: alta de clientes (admin) y selección de cuenta para editar alias.

export function usePortalForms() {
  const [createClientForm, setCreateClientForm] = useState<CreateClientFormState>({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
    environment: "test",
  });
  const [selectedAccountForAlias, setSelectedAccountForAlias] = useState<string | null>(null);

  return {
    createClientForm,
    selectedAccountForAlias,
    setCreateClientForm,
    setSelectedAccountForAlias,
  };
}
