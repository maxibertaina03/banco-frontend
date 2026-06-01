import { memo, useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { syncCentralBankAccount } from "../../personas/api/personas.api";
import type { CentralBankAccountSyncResult, PersonaFullResponse } from "../../../lib/api";

interface SingleAccountSyncCardProps {
  environment: "test" | "prod";
  profile: PersonaFullResponse;
  onAccountSynced: () => Promise<void> | void;
}

export const SingleAccountSyncCard = memo(function SingleAccountSyncCard({ environment, profile, onAccountSynced }: SingleAccountSyncCardProps) {
  const [accountId, setAccountId] = useState(profile.cuentas[0]?.id || "");
  const [result, setResult] = useState<CentralBankAccountSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    if (!accountId) { setError("Elegí una cuenta para sincronizar."); setResult(null); return; }
    setLoading(true); setError(null); setResult(null);
    try { setResult(await syncCentralBankAccount(accountId, environment)); await onAccountSynced(); }
    catch (err) { setError(err instanceof Error ? err.message : "No se pudo sincronizar la cuenta."); }
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
            <div className="rounded-2xl bg-[#2D1548]/60 p-4"><p className="text-xs text-muted-foreground">CBU asignado por el Banco Central</p><p className="font-mono text-sm text-primary">{result.centralBank?.cbu || result.account?.cbu || "Sin CBU"}</p></div>
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
