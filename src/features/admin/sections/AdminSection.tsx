import { memo, useState, type FormEvent } from "react";
import { Building2, Users } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import type {
  CentralBankRecord,
  PersonaCompleta,
  Rol,
  TipoCuentaRecord,
} from "../../../lib/api";
import { InterbankMassSyncSection } from "./InterbankMassSyncSection";
import { TarjetaListaTransacciones } from "../cards/TarjetaListaTransacciones";
import { BankLookupCard } from "../cards/BankLookupCard";
import { BankRenameCard } from "../cards/BankRenameCard";
import { PersonCbuLookupCard } from "../cards/PersonCbuLookupCard";
import { AliasUpdateCard } from "../cards/AliasUpdateCard";
import { PersonAliasLookupCard } from "../cards/PersonAliasLookupCard";
import { TarjetaSincronizarCuenta } from "../cards/TarjetaSincronizarCuenta";

export interface CreateClientFormState {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  environment: "test" | "prod";
}

interface AdminSectionProps {
  tiposDeCuenta: TipoCuentaRecord[];
  banks: CentralBankRecord[];
  createClientForm: CreateClientFormState;
  onCreateClientFormChange: (next: CreateClientFormState) => void;
  onCuentaSincronizada: () => Promise<void> | void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  perfil: PersonaCompleta;
  roles: Rol[];
  submitting: boolean;
  totalBalance: string;
}


// ─── Main exported component ─────────────────────────────────────────────────

export const AdminSection = memo(function AdminSection({
  banks,
  createClientForm,
  onCreateClientFormChange,
  onCuentaSincronizada,
  onSubmit,
  perfil,
  submitting,
  totalBalance,
}: AdminSectionProps) {
  const env = createClientForm.environment;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      {/* Registrar persona */}
      <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
        <CardHeader>
          <CardTitle>Registrar nuevo cliente</CardTitle>
          <CardDescription>
            Da de alta a un cliente nuevo y le asigna su primera cuenta con CBU.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={createClientForm.nombre} onChange={(e) => onCreateClientFormChange({ ...createClientForm, nombre: e.target.value })} placeholder="Nombre" />
              <Input value={createClientForm.apellido} onChange={(e) => onCreateClientFormChange({ ...createClientForm, apellido: e.target.value })} placeholder="Apellido" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={createClientForm.dni} onChange={(e) => onCreateClientFormChange({ ...createClientForm, dni: e.target.value })} placeholder="DNI" />
              <Input value={createClientForm.email} onChange={(e) => onCreateClientFormChange({ ...createClientForm, email: e.target.value })} placeholder="Email" />
            </div>
            <Input value={createClientForm.telefono} onChange={(e) => onCreateClientFormChange({ ...createClientForm, telefono: e.target.value })} placeholder="Teléfono (opcional)" />
            <select
              value={createClientForm.environment}
              onChange={(e) => onCreateClientFormChange({ ...createClientForm, environment: e.target.value as "test" | "prod" })}
              className="h-11 rounded-xl border border-primary/20 bg-[#2D1548]/60 px-4 text-sm outline-none"
            >
              <option value="test">Entorno test</option>
              <option value="prod">Entorno prod</option>
            </select>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-muted-foreground">
              Si el DNI ya tiene cuenta registrada se reutiliza; caso contrario, se crea un alta nueva
              con una cuenta inicial.
            </div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-emerald-300">
              El CBU asignado se muestra en el aviso de éxito al confirmar el alta.
            </div>
            <Button type="submit" disabled={submitting}>Registrar cliente</Button>
          </form>
        </CardContent>
      </Card>

      {/* Ficha operativa */}
      <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
        <CardHeader>
          <CardTitle>Ficha operativa</CardTitle>
          <CardDescription>Vista consolidada de la persona seleccionada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-[#2D1548]/60 p-4">
            <span>Roles</span>
            <div className="flex flex-wrap gap-2">
              {perfil.roles.map((role) => <Badge key={role.id}>{role.nombre}</Badge>)}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-[#2D1548]/60 p-4">
            <span>Usuario</span>
            <Badge variant={perfil.usuario?.activo ? "default" : "secondary"}>
              {perfil.usuario?.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-[#2D1548]/60 p-4">
            <span>Cuentas</span>
            <span className="text-primary">{perfil.cuentas.length}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-[#2D1548]/60 p-4">
            <span>Saldo total</span>
            <span className="text-primary">{totalBalance}</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            Si algunos catálogos no cargan, podés seguir operando con funciones reducidas en este panel.
          </div>
        </CardContent>
      </Card>

      {/* Bancos registrados */}
      <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] xl:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Bancos registrados
          </CardTitle>
          <CardDescription>Lista de bancos disponibles en Banco Central para el entorno configurado.</CardDescription>
        </CardHeader>
        <CardContent>
          {banks.length === 0 ? (
            <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-muted-foreground">
              No pude cargar bancos registrados desde Banco Central.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {banks.map((bank) => (
                <div key={bank.bankCode} className="rounded-2xl bg-[#2D1548]/60 p-4">
                  <p className="text-xs text-muted-foreground">Código</p>
                  <p className="font-mono text-sm text-primary">{bank.bankCode}</p>
                  <p className="mt-2 text-sm">{bank.name}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sub-components — each manages its own state */}
      <InterbankMassSyncSection environment={env} />
      <TarjetaSincronizarCuenta environment={env} perfil={perfil} onCuentaSincronizada={onCuentaSincronizada} />
      <TarjetaListaTransacciones environment={env} />
      <BankLookupCard environment={env} />
      <BankRenameCard environment={env} />
      <PersonCbuLookupCard environment={env} />
      <AliasUpdateCard environment={env} />
      <PersonAliasLookupCard environment={env} />
    </div>
  );
});
