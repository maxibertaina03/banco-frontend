import { memo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { findCentralPersonByAlias } from "../../personas/api/personas.api";
import type { CentralPersonLookupResult } from "../../../lib/api";

interface PersonAliasLookupCardProps {
  environment: "test" | "prod";
}

export const PersonAliasLookupCard = memo(function PersonAliasLookupCard({ environment }: PersonAliasLookupCardProps) {
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
