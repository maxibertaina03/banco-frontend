import { memo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { getCentralBankByCode } from "../../personas/api/personas.api";
import type { CentralBankRecord } from "../../../lib/api";

interface BankLookupCardProps {
  environment: "test" | "prod";
}

export const BankLookupCard = memo(function BankLookupCard({ environment }: BankLookupCardProps) {
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
