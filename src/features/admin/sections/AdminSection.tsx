import type { FormEvent } from "react";
import { Users } from "lucide-react";
import { Badge } from "../../../app/components/ui/badge";
import { Button } from "../../../app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../app/components/ui/card";
import { Input } from "../../../app/components/ui/input";
import type { PersonaFullResponse, RoleRecord, TipoCuentaRecord } from "../../../lib/api";

export interface CreateClientFormState {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  clerkId: string;
  roleId: string;
  tipoCuentaId: string;
  numeroCuenta: string;
  cbu: string;
  saldo: string;
}

interface AdminSectionProps {
  accountTypes: TipoCuentaRecord[];
  createClientForm: CreateClientFormState;
  onCreateClientFormChange: (next: CreateClientFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  profile: PersonaFullResponse;
  roles: RoleRecord[];
  submitting: boolean;
  totalBalance: string;
}

export function AdminSection({
  accountTypes,
  createClientForm,
  onCreateClientFormChange,
  onSubmit,
  profile,
  roles,
  submitting,
  totalBalance,
}: AdminSectionProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
        <CardHeader>
          <CardTitle>Alta de cliente</CardTitle>
          <CardDescription>Construye persona, usuario, rol y cuenta inicial.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={createClientForm.nombre}
                onChange={(event) =>
                  onCreateClientFormChange({ ...createClientForm, nombre: event.target.value })
                }
                placeholder="Nombre"
              />
              <Input
                value={createClientForm.apellido}
                onChange={(event) =>
                  onCreateClientFormChange({ ...createClientForm, apellido: event.target.value })
                }
                placeholder="Apellido"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={createClientForm.dni}
                onChange={(event) =>
                  onCreateClientFormChange({ ...createClientForm, dni: event.target.value })
                }
                placeholder="DNI"
              />
              <Input
                value={createClientForm.email}
                onChange={(event) =>
                  onCreateClientFormChange({ ...createClientForm, email: event.target.value })
                }
                placeholder="Email"
              />
            </div>
            <Input
              value={createClientForm.telefono}
              onChange={(event) =>
                onCreateClientFormChange({ ...createClientForm, telefono: event.target.value })
              }
              placeholder="Telefono"
            />
            <Input
              value={createClientForm.clerkId}
              onChange={(event) =>
                onCreateClientFormChange({ ...createClientForm, clerkId: event.target.value })
              }
              placeholder="clerk_id opcional"
            />
            {roles.length > 0 && (
              <select
                value={createClientForm.roleId}
                onChange={(event) =>
                  onCreateClientFormChange({ ...createClientForm, roleId: event.target.value })
                }
                className="h-11 rounded-xl border border-primary/20 bg-[#2D1548]/60 px-4 text-sm outline-none"
              >
                <option value="">Rol inicial</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.nombre}
                  </option>
                ))}
              </select>
            )}
            {accountTypes.length > 0 && (
              <select
                value={createClientForm.tipoCuentaId}
                onChange={(event) =>
                  onCreateClientFormChange({ ...createClientForm, tipoCuentaId: event.target.value })
                }
                className="h-11 rounded-xl border border-primary/20 bg-[#2D1548]/60 px-4 text-sm outline-none"
              >
                <option value="">Tipo de cuenta inicial</option>
                {accountTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.nombre}
                  </option>
                ))}
              </select>
            )}
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                value={createClientForm.numeroCuenta}
                onChange={(event) =>
                  onCreateClientFormChange({
                    ...createClientForm,
                    numeroCuenta: event.target.value,
                  })
                }
                placeholder="Numero de cuenta"
              />
              <Input
                value={createClientForm.cbu}
                onChange={(event) =>
                  onCreateClientFormChange({ ...createClientForm, cbu: event.target.value })
                }
                placeholder="CBU"
              />
              <Input
                value={createClientForm.saldo}
                onChange={(event) =>
                  onCreateClientFormChange({ ...createClientForm, saldo: event.target.value })
                }
                placeholder="Saldo inicial"
              />
            </div>
            <Button type="submit" disabled={submitting}>
              Crear cliente
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
        <CardHeader>
          <CardTitle>Ficha operativa</CardTitle>
          <CardDescription>Vista consolidada de la persona seleccionada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-[#2D1548]/60 p-4">
            <span>Roles</span>
            <div className="flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <Badge key={role.id}>{role.nombre}</Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-[#2D1548]/60 p-4">
            <span>Usuario</span>
            <Badge variant={profile.usuario?.activo ? "default" : "secondary"}>
              {profile.usuario?.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-[#2D1548]/60 p-4">
            <span>Cuentas</span>
            <span className="text-primary">{profile.cuentas.length}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-[#2D1548]/60 p-4">
            <span>Saldo total</span>
            <span className="text-primary">{totalBalance}</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            Si `roles`, `tipos-cuenta` o `tipos-transaccion` fallan en backend, este panel sigue usable pero con menos ayudas visuales.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
