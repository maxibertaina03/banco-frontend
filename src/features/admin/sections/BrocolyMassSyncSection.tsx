import { AlertTriangle, CheckCircle, RefreshCcw, RefreshCw, XCircle } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  bulkSyncAccounts,
  listAccountsForSync,
  syncCentralBankAccount,
} from "../../personas/api/personas.api";
import type { SyncAccountRecord } from "../../personas/types/personas.types";

interface BrocolyMassSyncSectionProps {
  environment: "test" | "prod";
}

export const BrocolyMassSyncSection = memo(function BrocolyMassSyncSection({ environment }: BrocolyMassSyncSectionProps) {
  const [accounts, setAccounts] = useState<SyncAccountRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [syncMessages, setSyncMessages] = useState<Record<string, { ok: boolean; text: string }>>({});

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await listAccountsForSync({ environment, limit: 200 });
      setAccounts(result.accounts ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No se pudo cargar la lista de cuentas.");
    } finally {
      setLoading(false);
    }
  }, [environment]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  async function handleSyncOne(accountId: string) {
    if (syncingId) return;
    setSyncingId(accountId);
    setSyncMessages((prev) => ({ ...prev, [accountId]: { ok: false, text: "" } }));

    try {
      const result = await syncCentralBankAccount(accountId, environment);
      setSyncMessages((prev) => ({
        ...prev,
        [accountId]: {
          ok: true,
          text: `CBU: ${result.centralBank?.cbu || result.account?.cbu || "asignado"}${result.account?.alias ? ` — Alias: ${result.account.alias}` : ""}`,
        },
      }));
      // Refresh the list row
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === accountId
            ? {
                ...account,
                cbu: result.centralBank?.cbu || result.account?.cbu || account.cbu,
                alias: result.account?.alias || account.alias,
                banco_central_registrada: result.account?.banco_central_registrada ?? true,
                sync_ready: true,
                sync_issues: [],
              }
            : account
        )
      );
    } catch (error) {
      setSyncMessages((prev) => ({
        ...prev,
        [accountId]: {
          ok: false,
          text: error instanceof Error ? error.message : "Error al sincronizar.",
        },
      }));
    } finally {
      setSyncingId(null);
    }
  }

  async function handleBulkSync() {
    if (bulkSyncing) return;
    setBulkSyncing(true);
    setSyncMessages({});

    try {
      const result = await bulkSyncAccounts({ environment });
      for (const item of result.results ?? []) {
        if (item.accountId) {
          setSyncMessages((prev) => ({
            ...prev,
            [item.accountId]: {
              ok: item.status === "success",
              text:
                item.status === "success"
                  ? `CBU: ${item.result?.centralBank?.cbu || item.result?.account?.cbu || "asignado"}`
                  : item.error || "Error al sincronizar.",
            },
          }));
        }
      }
      await loadAccounts();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Error en sincronización masiva.");
    } finally {
      setBulkSyncing(false);
    }
  }

  const synced = accounts.filter((a) => a.banco_central_registrada);
  const unsynced = accounts.filter((a) => !a.banco_central_registrada);
  const ready = unsynced.filter((a) => a.sync_ready);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] xl:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-primary" />
              Vincular cuentas con Brocoly
            </CardTitle>
            <CardDescription className="mt-1">
              Registra cada cuenta en el Banco Central y obtiene su CBU real. Las cuentas ya vinculadas pueden
              enviar y recibir transferencias interbancarias.
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={() => void loadAccounts()}
            disabled={loading}
            className="rounded-lg border border-primary/20 p-2 text-muted-foreground transition hover:text-primary disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        {accounts.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-center">
              <p className="text-2xl font-semibold text-emerald-400">{synced.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Vinculadas a Brocoly</p>
            </div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-center">
              <p className="text-2xl font-semibold text-amber-400">{unsynced.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Sin vincular</p>
            </div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-center">
              <p className="text-2xl font-semibold text-primary">{accounts.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        )}

        {/* Bulk sync button */}
        {ready.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3">
            <p className="text-sm text-amber-300">
              {ready.length} {ready.length === 1 ? "cuenta lista" : "cuentas listas"} para vincular con Brocoly
            </p>
            <Button
              type="button"
              disabled={bulkSyncing}
              onClick={() => void handleBulkSync()}
              className="shrink-0"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${bulkSyncing ? "animate-spin" : ""}`} />
              {bulkSyncing ? "Vinculando..." : "Vincular todas"}
            </Button>
          </div>
        )}

        {loadError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {loadError}
          </div>
        )}

        {loading && accounts.length === 0 && (
          <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-muted-foreground">
            Cargando cuentas...
          </div>
        )}

        {!loading && accounts.length === 0 && !loadError && (
          <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-muted-foreground">
            No hay cuentas registradas en el sistema.
          </div>
        )}

        {/* Account list */}
        {accounts.length > 0 && (
          <div className="space-y-2">
            {accounts.map((account) => {
              const msg = syncMessages[account.id];
              const isSyncing = syncingId === account.id;

              return (
                <div
                  key={account.id}
                  className={`rounded-2xl border p-4 transition ${
                    account.banco_central_registrada
                      ? "border-emerald-400/20 bg-emerald-400/5"
                      : "border-amber-400/15 bg-[#2D1548]/40"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Person + account info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {account.nombre} {account.apellido}
                        </span>
                        <span className="rounded-full bg-[#2D1548]/60 px-2 py-0.5 text-xs text-muted-foreground">
                          DNI {account.dni}
                        </span>
                        <span className="rounded-full bg-[#2D1548]/60 px-2 py-0.5 text-xs text-muted-foreground">
                          {account.tipo_cuenta_nombre}
                        </span>
                        {account.banco_central_registrada ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs text-emerald-400">
                            <CheckCircle className="h-3 w-3" />
                            Brocoly
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs text-amber-400">
                            <XCircle className="h-3 w-3" />
                            Sin vincular
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {account.cbu ? (
                          <span className="font-mono">CBU: {account.cbu}</span>
                        ) : (
                          <span className="text-amber-400/70">Sin CBU Brocoly</span>
                        )}
                        {account.alias && <span>Alias: {account.alias}</span>}
                      </div>

                      {/* Sync issues */}
                      {!account.banco_central_registrada && account.sync_issues.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {account.sync_issues.map((issue) => (
                            <span
                              key={issue}
                              className="flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-0.5 text-xs text-destructive"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              {issue}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Sync result message */}
                      {msg?.text && (
                        <p className={`mt-1.5 text-xs ${msg.ok ? "text-emerald-400" : "text-destructive"}`}>
                          {msg.text}
                        </p>
                      )}
                    </div>

                    {/* Sync button */}
                    {!account.banco_central_registrada && (
                      <button
                        type="button"
                        onClick={() => void handleSyncOne(account.id)}
                        disabled={isSyncing || !!syncingId || bulkSyncing || !account.sync_ready}
                        title={!account.sync_ready ? account.sync_issues.join(". ") : "Vincular con Brocoly"}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-primary/20 bg-[#2D1548]/60 px-3 py-1.5 text-xs text-primary transition hover:bg-[#2D1548] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? "Vinculando..." : "Vincular"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
