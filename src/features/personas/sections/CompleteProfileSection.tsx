import type { FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import type { CompleteProfileFormState } from "../../../hooks/usePortalForms";

interface CompleteProfileSectionProps {
  form: CompleteProfileFormState;
  submitting: boolean;
  onChange: (next: CompleteProfileFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function CompleteProfileSection({ form, submitting, onChange, onSubmit }: CompleteProfileSectionProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
      <CardHeader className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle>Completa tu perfil para continuar</CardTitle>
        <CardDescription>
          Terminamos el alta en Clerk, pero todavía faltan datos obligatorios en la base local de Orbital.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="complete-profile-nombre">Nombre</Label>
            <Input
              id="complete-profile-nombre"
              value={form.nombre}
              onChange={(event) => onChange({ ...form, nombre: event.target.value })}
              placeholder="Nombre"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="complete-profile-apellido">Apellido</Label>
            <Input
              id="complete-profile-apellido"
              value={form.apellido}
              onChange={(event) => onChange({ ...form, apellido: event.target.value })}
              placeholder="Apellido"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="complete-profile-dni">DNI</Label>
            <Input
              id="complete-profile-dni"
              value={form.dni}
              onChange={(event) => onChange({ ...form, dni: event.target.value })}
              placeholder="DNI"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="complete-profile-email">Email</Label>
            <Input
              id="complete-profile-email"
              type="email"
              value={form.email}
              onChange={(event) => onChange({ ...form, email: event.target.value })}
              placeholder="Email"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="complete-profile-telefono">Telefono</Label>
            <Input
              id="complete-profile-telefono"
              value={form.telefono}
              onChange={(event) => onChange({ ...form, telefono: event.target.value })}
              placeholder="Telefono"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="complete-profile-fecha-nacimiento">Fecha de nacimiento</Label>
            <Input
              id="complete-profile-fecha-nacimiento"
              type="date"
              value={form.fechaNacimiento}
              onChange={(event) => onChange({ ...form, fechaNacimiento: event.target.value })}
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-3 rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-muted-foreground">
            <p>Cuando guardes, se marcará `perfil_completo = true` y el portal volverá a cargar tus datos.</p>
            <Button type="submit" disabled={submitting}>
              Guardar y continuar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
