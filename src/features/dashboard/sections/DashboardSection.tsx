import type { FormEvent } from "react";
import { QuickActions } from "../../../components/QuickActions";
import { RecentActivity } from "../../../components/RecentActivity";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import type { PersonaFullResponse, UserActivity } from "../../../lib/api";

export interface ProfileFormState {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  activo: boolean;
}

interface DashboardSectionProps {
  activities: UserActivity[];
  loading: boolean;
  profile: PersonaFullResponse;
  profileForm: ProfileFormState;
  submitting: boolean;
  onAccounts: () => void;
  onActivity: () => void;
  onContacts: () => void;
  onCopyCbu: () => void;
  onIncome: () => void;
  onProfileFormChange: (next: ProfileFormState) => void;
  onProfileSave: (event: FormEvent<HTMLFormElement>) => void;
  onTransfer: () => void;
}

export function DashboardSection({
  activities,
  loading,
  profile,
  profileForm,
  submitting,
  onAccounts,
  onActivity,
  onContacts,
  onCopyCbu,
  onIncome,
  onProfileFormChange,
  onProfileSave,
  onTransfer,
}: DashboardSectionProps) {
  return (
    <>
      <div className="mb-8">
        <QuickActions
          onTransfer={onTransfer}
          onAccounts={onAccounts}
          onContacts={onContacts}
          onActivity={onActivity}
          onIncome={onIncome}
          onCopyCbu={onCopyCbu}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
          <CardHeader>
            <CardTitle>Perfil Orbital</CardTitle>
            <CardDescription>Actualiza `personas` y `usuarios` desde el frontend unificado.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={onProfileSave}>
              <Input
                value={profileForm.nombre}
                onChange={(event) => onProfileFormChange({ ...profileForm, nombre: event.target.value })}
                placeholder="Nombre"
              />
              <Input
                value={profileForm.apellido}
                onChange={(event) => onProfileFormChange({ ...profileForm, apellido: event.target.value })}
                placeholder="Apellido"
              />
              <Input
                value={profileForm.email}
                onChange={(event) => onProfileFormChange({ ...profileForm, email: event.target.value })}
                placeholder="Email"
              />
              <Input
                value={profileForm.telefono}
                onChange={(event) => onProfileFormChange({ ...profileForm, telefono: event.target.value })}
                placeholder="Telefono"
              />
              <label className="md:col-span-2 flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={profileForm.activo}
                  onChange={(event) => onProfileFormChange({ ...profileForm, activo: event.target.checked })}
                />
                Usuario habilitado
              </label>
              <div className="md:col-span-2">
                <Button type="submit" disabled={submitting}>
                  Guardar cambios
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <RecentActivity activities={activities} loading={loading} />
      </div>
    </>
  );
}
