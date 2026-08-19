import { memo, useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { sincronizarCuentaConCentral } from "../../personas/api/personas.api";
import type { ResultadoSincronizacionCuenta, PersonaCompleta } from "../../../lib/api";

interface TarjetaSincronizarCuentaProps {
  environment: "test" | "prod";
  perfil: PersonaCompleta;
  onCuentaSincronizada: () => Promise<void> | void;
}

export const TarjetaSincronizarCuenta = memo(function TarjetaSincronizarCuenta({ environment, perfil, onCuentaSincronizada }: TarjetaSincronizarCuentaProps) {
  const [idCuenta, setIdCuenta] = useState(perfil.cuentas[0]?.id || "");
  const [result, setResult] = useState<ResultadoSincronizacionCuenta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    if (!idCuenta) { setError("Elegí una cuenta para sincronizar."); setResult(null); return; }
    setLoading(true); setError(null); setResult(null);
    try { setResult(await sincronizarCuentaConCentral(idCuenta, environment)); await onCuentaSincronizada(); }
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
        <select value={idCuenta} onChange={(e) => setIdCuenta(e.target.value)} className="h-11 w-full rounded-xl border border-primary/20 bg-[#2D1548]/60 px-4 text-sm outline-none">
          {perfil.cuentas.map((cuenta) => (
            <option key={cuenta.id} value={cuenta.id}>
              {(cuenta.tipo_cuenta_nombre || "Cuenta") + " - " + cuenta.numero_cuenta}
              {cuenta.cbu ? ` - ${cuenta.cbu}` : ""}
            </option>
          ))}
        </select>
        <Button type="button" disabled={loading || perfil.cuentas.length === 0} onClick={() => void handleSync()}>
          {loading ? "Sincronizando..." : "Sincronizar cuenta"}
        </Button>
        {error && <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-destructive">{error}</div>}
        {result && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-[#2D1548]/60 p-4"><p className="text-xs text-muted-foreground">CBU asignado por el Banco Central</p><p className="font-mono text-sm text-primary">{result.centralBank?.cbu || result.cuenta?.cbu || "Sin CBU"}</p></div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4"><p className="text-xs text-muted-foreground">Alias</p><p className="text-sm">{result.cuenta?.alias || "Sin alias"}</p></div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4 md:col-span-2"><p className="text-xs text-muted-foreground">Estado local</p><p className="text-sm">{result.cuenta?.banco_central_registrada ? "Cuenta lista para transferencias por Banco Central" : "La cuenta todavía no quedó marcada como sincronizada"}</p></div>
            {result.warnings && result.warnings.length > 0 && (
              <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-amber-200 md:col-span-2">{result.warnings.join(" ")}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
