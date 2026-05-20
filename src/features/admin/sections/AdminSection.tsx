import { memo, useState, type FormEvent } from "react";
import { Building2, PencilLine, Search, Users } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import {
  findCentralPersonByAlias,
  findCentralPersonByCbu,
  getCentralBankByCode,
  listCentralBankTransactions,
  syncCentralBankAccount,
  updateCentralBankName,
} from "../../personas/api/personas.api";
import { updateAlias } from "../../cuentas/api/cuentas.api";
import type {
  CentralBankRecord,
  CentralBankAccountSyncResult,
  CentralBankTransactionRecord,
  CentralPersonLookupResult,
  PersonaFullResponse,
  RoleRecord,
  TipoCuentaRecord,
} from "../../../lib/api";
import { BrocolyMassSyncSection } from "./BrocolyMassSyncSection";

export interface CreateClientFormState {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  environment: "test" | "prod";
}

interface AdminSectionProps {
  accountTypes: TipoCuentaRecord[];
  banks: CentralBankRecord[];
  createClientForm: CreateClientFormState;
  onCreateClientFormChange: (next: CreateClientFormState) => void;
  onAccountSynced: () => Promise<void> | void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  profile: PersonaFullResponse;
  roles: RoleRecord[];
  submitting: boolean;
  totalBalance: string;
}

// ─── Internal sub-components ────────────────────────────────────────────────
// Each card manages its own isolated state so the parent stays lean.

interface EnvProp { environment: "test" | "prod" }

const TransactionListCard = memo(function TransactionListCard({ environment }: EnvProp) {
  const [minutes, setMinutes] = useState("30");
  const [transactions, setTransactions] = useState<CentralBankTransactionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLookup() {
    const mins = Number.parseInt(minutes.trim(), 10);
    if (!Number.isFinite(mins) || mins < 1 || mins > 1440) {
      setError("Ingresa una ventana válida entre 1 y 1440 minutos.");
      setTransactions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setTransactions(await listCentralBankTransactions(environment, mins));
    } catch (err) {
      setTransactions([]);
      setError(err instanceof Error ? err.message : "No se pudieron obtener las transacciones.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] xl:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Listar transacciones del banco
        </CardTitle>
        <CardDescription>
          Consulta las últimas transacciones del banco autenticado en Banco Central usando una ventana de minutos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[220px_auto]">
          <Input value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="Minutos (1-1440)" />
          <Button type="button" disabled={loading} onClick={() => void handleLookup()}>
            {loading ? "Consultando..." : "Listar transacciones"}
          </Button>
        </div>
        <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-muted-foreground">
          Recomendado: consultar cada 15 minutos con una ventana de 30 para no perder transferencias.
        </div>
        {error && <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-destructive">{error}</div>}
        {transactions.length > 0 && (
          <div className="grid gap-3">
            {transactions.map((tx, i) => (
              <div
                key={tx._id || `${tx.cbuOrigen}-${tx.cbuDestino}-${i}`}
                className="rounded-2xl bg-[#2D1548]/60 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <p className="text-sm text-primary">{tx.estado || "sin estado"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Importe</p>
                    <p className="text-sm">${Number(tx.importe || 0).toLocaleString("es-AR")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha</p>
                    <p className="text-sm">{tx.createdAt ? new Date(tx.createdAt).toLocaleString("es-AR") : "Sin fecha"}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-primary/10 p-3">
                    <p className="text-xs text-muted-foreground">Origen</p>
                    <p className="text-sm">{[tx.personaOrigen?.nombre, tx.personaOrigen?.apellido].filter(Boolean).join(" ") || "Sin nombre"}</p>
                    <p className="font-mono text-xs text-primary">{tx.cbuOrigen}</p>
                    <p className="text-xs text-muted-foreground">DNI: {tx.personaOrigen?.dni || "Sin DNI"}</p>
                    <p className="text-xs text-muted-foreground">Alias: {tx.personaOrigen?.alias || "Sin alias"}</p>
                  </div>
                  <div className="rounded-2xl border border-primary/10 p-3">
                    <p className="text-xs text-muted-foreground">Destino</p>
                    <p className="text-sm">{[tx.personaDestino?.nombre, tx.personaDestino?.apellido].filter(Boolean).join(" ") || "Sin nombre"}</p>
                    <p className="font-mono text-xs text-primary">{tx.cbuDestino}</p>
                    <p className="text-xs text-muted-foreground">Alias: {tx.personaDestino?.alias || "Sin alias"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!error && !loading && transactions.length === 0 && (
          <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-muted-foreground">
            Todavía no consultaste transacciones o no hubo movimientos en esa ventana.
          </div>
        )}
      </CardContent>
    </Card>
  );
});

const BankLookupCard = memo(function BankLookupCard({ environment }: EnvProp) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CentralBankRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLookup() {
    if (!code.trim()) { setError("Ingresa un código de banco."); setResult(null); return; }
    setLoading(true); setError(null);
    try { setResult(await getCentralBankByCode(code.trim(), environment)); }
    catch (err) { setResult(null); setError(err instanceof Error ? err.message : "No se pudo obtener el banco."); }
    finally { setLoading(false); }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] xl:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary" />Obtener banco por código</CardTitle>
        <CardDescription>Busca un banco puntual por `bankCode` en el entorno seleccionado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código de banco" />
          <Button type="button" disabled={loading} onClick={() => void handleLookup()}>{loading ? "Buscando..." : "Buscar banco"}</Button>
        </div>
        {error && <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-destructive">{error}</div>}
        {result && (
          <div className="rounded-2xl bg-[#2D1548]/60 p-4">
            <p className="text-xs text-muted-foreground">Código</p>
            <p className="font-mono text-sm text-primary">{result.bankCode}</p>
            <p className="mt-2 text-sm">{result.name}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

const BankRenameCard = memo(function BankRenameCard({ environment }: EnvProp) {
  const [name, setName] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRename() {
    if (!name.trim()) { setError("Ingresa un nombre para el banco."); setSuccess(null); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      const result = await updateCentralBankName({ name: name.trim(), environment });
      setSuccess(result.registry?.nombre || result.config?.bank_name || result.centralBank?.name || "Nombre actualizado.");
      setName("");
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo actualizar el nombre."); }
    finally { setLoading(false); }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] xl:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PencilLine className="h-5 w-5 text-primary" />Cambiar nombre del banco</CardTitle>
        <CardDescription>Actualiza el nombre del banco autenticado en Banco Central y en tu configuración local.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nuevo nombre del banco" />
          <Button type="button" disabled={loading} onClick={() => void handleRename()}>{loading ? "Actualizando..." : "Actualizar nombre"}</Button>
        </div>
        {error && <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-destructive">{error}</div>}
        {success && <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-emerald-300">Nombre actualizado: {success}</div>}
      </CardContent>
    </Card>
  );
});

const PersonCbuLookupCard = memo(function PersonCbuLookupCard({ environment }: EnvProp) {
  const [cbu, setCbu] = useState("");
  const [result, setResult] = useState<CentralPersonLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLookup() {
    if (!cbu.trim()) { setError("Ingresa un CBU."); setResult(null); return; }
    setLoading(true); setError(null);
    try { setResult(await findCentralPersonByCbu(cbu.trim(), environment)); }
    catch (err) { setResult(null); setError(err instanceof Error ? err.message : "No se pudo obtener la persona."); }
    finally { setLoading(false); }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] xl:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary" />Buscar persona por CBU</CardTitle>
        <CardDescription>Consulta en Banco Central la persona asociada a un CBU puntual.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <Input value={cbu} onChange={(e) => setCbu(e.target.value)} placeholder="CBU de 22 dígitos" />
          <Button type="button" disabled={loading} onClick={() => void handleLookup()}>{loading ? "Buscando..." : "Buscar persona"}</Button>
        </div>
        {error && <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-destructive">{error}</div>}
        {result && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-[#2D1548]/60 p-4"><p className="text-xs text-muted-foreground">Titular</p><p className="text-sm">{[result.nombre, result.apellido].filter(Boolean).join(" ") || "Sin nombre"}</p></div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4"><p className="text-xs text-muted-foreground">DNI</p><p className="text-sm">{result.dni || "Sin DNI"}</p></div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4"><p className="text-xs text-muted-foreground">CBU</p><p className="font-mono text-sm text-primary">{result.cbu || cbu}</p></div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4"><p className="text-xs text-muted-foreground">Alias</p><p className="text-sm">{result.alias || "Sin alias"}</p></div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4 md:col-span-2"><p className="text-xs text-muted-foreground">Banco</p><p className="text-sm">{result.bankName || "Banco no informado"}{typeof result.bankCode === "number" ? ` (${result.bankCode})` : ""}</p></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

const AliasUpdateCard = memo(function AliasUpdateCard(_: EnvProp) {
  const [cbu, setCbu] = useState("");
  const [alias, setAlias] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (!cbu.trim()) { setError("Ingresa un CBU."); setSuccess(null); return; }
    if (!alias.trim()) { setError("Ingresa un alias."); setSuccess(null); return; }
    setLoading(true); setError(null); setSuccess(null);
    try { await updateAlias(cbu.trim(), alias.trim()); setSuccess(`Alias actualizado para ${cbu.trim()}: ${alias.trim()}`); setAlias(""); }
    catch (err) { setError(err instanceof Error ? err.message : "No se pudo actualizar el alias."); }
    finally { setLoading(false); }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] xl:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PencilLine className="h-5 w-5 text-primary" />Asignar o cambiar alias</CardTitle>
        <CardDescription>Actualiza el alias de una persona registrada en Banco Central a partir de su CBU.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input value={cbu} onChange={(e) => setCbu(e.target.value)} placeholder="CBU" />
          <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Nuevo alias" />
          <Button type="button" disabled={loading} onClick={() => void handleUpdate()}>{loading ? "Actualizando..." : "Actualizar alias"}</Button>
        </div>
        {error && <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-destructive">{error}</div>}
        {success && <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-emerald-300">{success}</div>}
      </CardContent>
    </Card>
  );
});

const PersonAliasLookupCard = memo(function PersonAliasLookupCard({ environment }: EnvProp) {
  const [alias, setAlias] = useState("");
  const [result, setResult] = useState<CentralPersonLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLookup() {
    if (!alias.trim()) { setError("Ingresa un alias."); setResult(null); return; }
    setLoading(true); setError(null);
    try { setResult(await findCentralPersonByAlias(alias.trim(), environment)); }
    catch (err) { setResult(null); setError(err instanceof Error ? err.message : "No se pudo obtener la persona."); }
    finally { setLoading(false); }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] xl:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary" />Buscar persona por alias</CardTitle>
        <CardDescription>Consulta en Banco Central la persona asociada a un alias puntual.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Alias" />
          <Button type="button" disabled={loading} onClick={() => void handleLookup()}>{loading ? "Buscando..." : "Buscar alias"}</Button>
        </div>
        {error && <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-destructive">{error}</div>}
        {result && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-[#2D1548]/60 p-4"><p className="text-xs text-muted-foreground">Titular</p><p className="text-sm">{[result.nombre, result.apellido].filter(Boolean).join(" ") || "Sin nombre"}</p></div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4"><p className="text-xs text-muted-foreground">DNI</p><p className="text-sm">{result.dni || "Sin DNI"}</p></div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4"><p className="text-xs text-muted-foreground">CBU</p><p className="font-mono text-sm text-primary">{result.cbu || "Sin CBU"}</p></div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4"><p className="text-xs text-muted-foreground">Alias</p><p className="text-sm">{result.alias || alias}</p></div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4 md:col-span-2"><p className="text-xs text-muted-foreground">Banco</p><p className="text-sm">{result.bankName || "Banco no informado"}{typeof result.bankCode === "number" ? ` (${result.bankCode})` : ""}</p></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

interface SingleAccountSyncCardProps extends EnvProp {
  profile: PersonaFullResponse;
  onAccountSynced: () => Promise<void> | void;
}

const SingleAccountSyncCard = memo(function SingleAccountSyncCard({ environment, profile, onAccountSynced }: SingleAccountSyncCardProps) {
  const [accountId, setAccountId] = useState(profile.cuentas[0]?.id || "");
  const [result, setResult] = useState<CentralBankAccountSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    if (!accountId) { setError("Elegí una cuenta para sincronizar."); setResult(null); return; }
    setLoading(true); setError(null); setResult(null);
    try { setResult(await syncCentralBankAccount(accountId, environment)); await onAccountSynced(); }
    catch (err) { setError(err instanceof Error ? err.message : "No se pudo sincronizar la cuenta con Brocoly."); }
    finally { setLoading(false); }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] xl:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />Sincronizar cuenta puntual</CardTitle>
        <CardDescription>Registra o reutiliza la cuenta en Banco Central y te devuelve el CBU asignado para usarla como origen.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-11 w-full rounded-xl border border-primary/20 bg-[#2D1548]/60 px-4 text-sm outline-none">
          {profile.cuentas.map((account) => (
            <option key={account.id} value={account.id}>
              {(account.tipo_cuenta_nombre || "Cuenta") + " - " + account.numero_cuenta}
              {account.cbu ? ` - ${account.cbu}` : ""}
            </option>
          ))}
        </select>
        <Button type="button" disabled={loading || profile.cuentas.length === 0} onClick={() => void handleSync()}>
          {loading ? "Sincronizando..." : "Sincronizar cuenta"}
        </Button>
        {error && <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-destructive">{error}</div>}
        {result && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-[#2D1548]/60 p-4"><p className="text-xs text-muted-foreground">CBU devuelto por Brocoly</p><p className="font-mono text-sm text-primary">{result.centralBank?.cbu || result.account?.cbu || "Sin CBU"}</p></div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4"><p className="text-xs text-muted-foreground">Alias</p><p className="text-sm">{result.account?.alias || "Sin alias"}</p></div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4 md:col-span-2"><p className="text-xs text-muted-foreground">Estado local</p><p className="text-sm">{result.account?.banco_central_registrada ? "Cuenta lista para transferencias por Banco Central" : "La cuenta todavía no quedó marcada como sincronizada"}</p></div>
            {result.warnings && result.warnings.length > 0 && (
              <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-amber-200 md:col-span-2">{result.warnings.join(" ")}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// ─── Main exported component ─────────────────────────────────────────────────

export const AdminSection = memo(function AdminSection({
  banks,
  createClientForm,
  onCreateClientFormChange,
  onAccountSynced,
  onSubmit,
  profile,
  submitting,
  totalBalance,
}: AdminSectionProps) {
  const env = createClientForm.environment;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      {/* Registrar persona */}
      <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
        <CardHeader>
          <CardTitle>Registrar persona</CardTitle>
          <CardDescription>
            Registra la persona en Banco Central y sincroniza la base local con el CBU devuelto.
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
            <Input value={createClientForm.telefono} onChange={(e) => onCreateClientFormChange({ ...createClientForm, telefono: e.target.value })} placeholder="Telefono opcional" />
            <select
              value={createClientForm.environment}
              onChange={(e) => onCreateClientFormChange({ ...createClientForm, environment: e.target.value as "test" | "prod" })}
              className="h-11 rounded-xl border border-primary/20 bg-[#2D1548]/60 px-4 text-sm outline-none"
            >
              <option value="test">Entorno test</option>
              <option value="prod">Entorno prod</option>
            </select>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-muted-foreground">
              Si el DNI ya existe en tu banco en Banco Central, se reutiliza el CBU y se sincroniza tu BD local.
              Si no existe, se crea una persona nueva y una cuenta local inicial.
            </div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-emerald-300">
              El CBU asignado por Brocoly se muestra en el mensaje de éxito superior cuando termina el alta.
            </div>
            <Button type="submit" disabled={submitting}>Registrar persona</Button>
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
              {profile.roles.map((role) => <Badge key={role.id}>{role.nombre}</Badge>)}
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
      <BrocolyMassSyncSection environment={env} />
      <SingleAccountSyncCard environment={env} profile={profile} onAccountSynced={onAccountSynced} />
      <TransactionListCard environment={env} />
      <BankLookupCard environment={env} />
      <BankRenameCard environment={env} />
      <PersonCbuLookupCard environment={env} />
      <AliasUpdateCard environment={env} />
      <PersonAliasLookupCard environment={env} />
    </div>
  );
});
