import { AlertTriangle, CheckCircle, RefreshCcw, RefreshCw, XCircle } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  sincronizarCuentasEnLote,
  listarCuentasParaSincronizar,
  sincronizarCuentaConCentral,
} from "../../personas/api/personas.api";
import type { CuentaParaSincronizar } from "../../personas/types/personas.types";

interface InterbankMassSyncSectionProps {
  environment: "test" | "prod";
}

export const InterbankMassSyncSection = memo(function InterbankMassSyncSection({ environment }: InterbankMassSyncSectionProps) {
  const [cuentas, setCuentas] = useState<CuentaParaSincronizar[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [syncMessages, setSyncMessages] = useState<Record<string, { ok: boolean; text: string }>>({});

  const cargarCuentas = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await listarCuentasParaSincronizar({ environment, limit: 200 });
      setCuentas(result.cuentas ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No se pudo cargar la lista de cuentas.");
    } finally {
      setLoading(false);
    }
  }, [environment]);

  useEffect(() => {
    void cargarCuentas();
  }, [cargarCuentas]);

  async function handleSyncOne(idCuenta: string) {
    if (syncingId) return;
    setSyncingId(idCuenta);
    setSyncMessages((prev) => ({ ...prev, [idCuenta]: { ok: false, text: "" } }));

    try {
      const result = await sincronizarCuentaConCentral(idCuenta, environment);
      setSyncMessages((prev) => ({
        ...prev,
        [idCuenta]: {
          ok: true,
          text: `CBU: ${result.centralBank?.cbu || result.cuenta?.cbu || "asignado"}${result.cuenta?.alias ? ` — Alias: ${result.cuenta.alias}` : ""}`,
        },
      }));
      // Refresh the list row
      setCuentas((prev) =>
        prev.map((cuenta) =>
          cuenta.id === idCuenta
            ? {
                ...cuenta,
                cbu: result.centralBank?.cbu || result.cuenta?.cbu || cuenta.cbu,
                alias: result.cuenta?.alias || cuenta.alias,
                banco_central_registrada: result.cuenta?.banco_central_registrada ?? true,
                sync_ready: true,
                sync_issues: [],
              }
            : cuenta
        )
      );
    } catch (error) {
      setSyncMessages((prev) => ({
        ...prev,
        [idCuenta]: {
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
      const result = await sincronizarCuentasEnLote({ environment });
      for (const item of result.results ?? []) {
        if (item.idCuenta) {
          setSyncMessages((prev) => ({
            ...prev,
            [item.idCuenta]: {
              ok: item.status === "success",
              text:
                item.status === "success"
                  ? `CBU: ${item.result?.centralBank?.cbu || item.result?.cuenta?.cbu || "asignado"}`
                  : item.error || "Error al sincronizar.",
            },
          }));
        }
      }
      await cargarCuentas();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Error en sincronización masiva.");
    } finally {
      setBulkSyncing(false);
    }
  }

  const synced = cuentas.filter((a) => a.banco_central_registrada);
  const unsynced = cuentas.filter((a) => !a.banco_central_registrada);
  const ready = unsynced.filter((a) => a.sync_ready);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] xl:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-primary" />
              Vincular cuentas con Banco Central
            </CardTitle>
            <CardDescription className="mt-1">
              Registra cada cuenta en el Banco Central y obtiene su CBU real. Las cuentas ya vinculadas pueden
              enviar y recibir transferencias interbancarias.
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={() => void cargarCuentas()}
            disabled={loading}
            className="rounded-lg border border-primary/20 p-2 text-muted-foreground transition hover:text-primary disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        {cuentas.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-center">
              <p className="text-2xl font-semibold text-emerald-400">{synced.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Vinculadas a Banco Central</p>
            </div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-center">
              <p className="text-2xl font-semibold text-amber-400">{unsynced.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Sin vincular</p>
            </div>
            <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-center">
              <p className="text-2xl font-semibold text-primary">{cuentas.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        )}

        {/* Bulk sync button */}
        {ready.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3">
            <p className="text-sm text-amber-300">
              {ready.length} {ready.length === 1 ? "cuenta lista" : "cuentas listas"} para vincular con Banco Central
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

        {loading && cuentas.length === 0 && (
          <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-muted-foreground">
            Cargando cuentas...
          </div>
        )}

        {!loading && cuentas.length === 0 && !loadError && (
          <div className="rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-muted-foreground">
            No hay cuentas registradas en el sistema.
          </div>
        )}

        {/* Cuenta list */}
        {cuentas.length > 0 && (
          <div className="space-y-2">
            {cuentas.map((cuenta) => {
              const msg = syncMessages[cuenta.id];
              const isSyncing = syncingId === cuenta.id;

              return (
                <div
                  key={cuenta.id}
                  className={`rounded-2xl border p-4 transition ${
                    cuenta.banco_central_registrada
                      ? "border-emerald-400/20 bg-emerald-400/5"
                      : "border-amber-400/15 bg-[#2D1548]/40"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Person + cuenta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {cuenta.nombre} {cuenta.apellido}
                        </span>
                        <span className="rounded-full bg-[#2D1548]/60 px-2 py-0.5 text-xs text-muted-foreground">
                          DNI {cuenta.dni}
                        </span>
                        <span className="rounded-full bg-[#2D1548]/60 px-2 py-0.5 text-xs text-muted-foreground">
                          {cuenta.tipo_cuenta_nombre}
                        </span>
                        {cuenta.banco_central_registrada ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs text-emerald-400">
                            <CheckCircle className="h-3 w-3" />
                            Banco Central
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs text-amber-400">
                            <XCircle className="h-3 w-3" />
                            Sin vincular
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {cuenta.cbu ? (
                          <span className="font-mono">CBU: {cuenta.cbu}</span>
                        ) : (
                          <span className="text-amber-400/70">Sin CBU Banco Central</span>
                        )}
                        {cuenta.alias && <span>Alias: {cuenta.alias}</span>}
                      </div>

                      {/* Sync issues */}
                      {!cuenta.banco_central_registrada && cuenta.sync_issues.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {cuenta.sync_issues.map((issue) => (
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
                    {!cuenta.banco_central_registrada && (
                      <button
                        type="button"
                        onClick={() => void handleSyncOne(cuenta.id)}
                        disabled={isSyncing || !!syncingId || bulkSyncing || !cuenta.sync_ready}
                        title={!cuenta.sync_ready ? cuenta.sync_issues.join(". ") : "Vincular con Banco Central"}
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
