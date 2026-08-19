import { memo, useState } from "react";
import { PencilLine } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { actualizarAlias } from "../../cuentas/api/cuentas.api";

interface AliasUpdateCardProps {
  environment: "test" | "prod";
}

export const AliasUpdateCard = memo(function AliasUpdateCard(_: AliasUpdateCardProps) {
  const [cbu, setCbu] = useState("");
  const [alias, setAlias] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (!cbu.trim()) { setError("Ingresa un CBU."); setSuccess(null); return; }
    if (!alias.trim()) { setError("Ingresa un alias."); setSuccess(null); return; }
    setLoading(true); setError(null); setSuccess(null);
    try { await actualizarAlias(cbu.trim(), alias.trim()); setSuccess(`Alias actualizado para ${cbu.trim()}: ${alias.trim()}`); setAlias(""); }
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
