import { memo, useState } from "react";
import { PencilLine } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { updateCentralBankName } from "../../personas/api/personas.api";

interface BankRenameCardProps {
  environment: "test" | "prod";
}

export const BankRenameCard = memo(function BankRenameCard({ environment }: BankRenameCardProps) {
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
