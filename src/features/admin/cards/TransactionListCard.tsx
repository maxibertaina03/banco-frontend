import { memo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { listCentralBankTransactions } from "../../personas/api/personas.api";
import type { CentralBankTransactionRecord } from "../../../lib/api";

interface TransactionListCardProps {
  environment: "test" | "prod";
}

export const TransactionListCard = memo(function TransactionListCard({ environment }: TransactionListCardProps) {
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
