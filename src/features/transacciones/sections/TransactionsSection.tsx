import { AlertTriangle, CheckCircle, Loader2, RefreshCcw, Search, XCircle } from "lucide-react";
import { memo, useEffect, useRef, useState, type FormEvent } from "react";
import { RecentActivity } from "../../../components/RecentActivity";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import type { PersonaFullResponse, UserActivity } from "../../../lib/api";
import { type ResolvedRecipient, resolveRecipient } from "../api/transacciones.api";
import type { SyncIncomingResult } from "../api/transacciones.api";

export interface TransferFormState {
  cuentaOrigenId: string;
  cbuDestino: string;
  monto: string;
  descripcion: string;
}

interface TransactionsSectionProps {
  activities: UserActivity[];
  lastSyncResult: SyncIncomingResult | null;
  loading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSyncIncoming: () => void;
  onTransferFormChange: (next: TransferFormState) => void;
  profile: PersonaFullResponse;
  submitting: boolean;
  syncingIncoming: boolean;
  transferForm: TransferFormState;
}

type LookupState = "idle" | "loading" | "found" | "not_found";

export const TransactionsSection = memo(function TransactionsSection({
  activities,
  lastSyncResult,
  loading,
  onSubmit,
  onSyncIncoming,
  onTransferFormChange,
  profile,
  submitting,
  syncingIncoming,
  transferForm,
}: TransactionsSectionProps) {
  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [resolvedRecipient, setResolvedRecipient] = useState<ResolvedRecipient | null>(null);
  const [lookupInput, setLookupInput] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-sync on mount (best-effort, no await blocking the render)
  const syncCalledRef = useRef(false);
  useEffect(() => {
    if (!syncCalledRef.current) {
      syncCalledRef.current = true;
      onSyncIncoming();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refs so the async lookup never closes over stale props
  const onTransferFormChangeRef = useRef(onTransferFormChange);
  onTransferFormChangeRef.current = onTransferFormChange;
  const transferFormRef = useRef(transferForm);
  transferFormRef.current = transferForm;

  const selectedOrigin = profile.cuentas.find((account) => account.id === transferForm.cuentaOrigenId);
  const originNotRegistered = selectedOrigin && selectedOrigin.banco_central_registrada === false;

  async function runLookup(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setLookupState("idle");
      setResolvedRecipient(null);
      return;
    }

    setLookupState("loading");
    setResolvedRecipient(null);

    try {
      const isCbu = /^\d{10,22}$/.test(trimmed);
      const result = await resolveRecipient(isCbu ? { cbu: trimmed } : { alias: trimmed });
      const cbu = result.cbu;

      if (cbu) {
        setResolvedRecipient(result);
        setLookupState("found");
        // Read from ref — never stale, never causes re-render loop
        onTransferFormChangeRef.current({ ...transferFormRef.current, cbuDestino: cbu });
      } else {
        setLookupState("not_found");
      }
    } catch {
      setLookupState("not_found");
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // 900ms debounce to avoid hammering Brocoly's rate limit
    debounceRef.current = setTimeout(() => void runLookup(lookupInput), 900);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupInput]); // only re-fires when the user types, not on every form change

  function handleSelectRecipient(cbu: string, alias?: string | null) {
    const displayValue = alias || cbu;
    setLookupInput(displayValue);
    onTransferFormChange({ ...transferForm, cbuDestino: cbu });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
        <CardHeader>
          <CardTitle>Realizar transferencia</CardTitle>
          <CardDescription>
            Usa CBU o alias. Destinos locales se acreditan al instante; externos van por Banco Central Brocoly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onSubmit}>
            {/* Cuenta origen */}
            <div className="grid gap-1">
              <label className="text-xs text-muted-foreground">Cuenta origen</label>
              <select
                value={transferForm.cuentaOrigenId}
                onChange={(event) =>
                  onTransferFormChange({ ...transferForm, cuentaOrigenId: event.target.value })
                }
                className="h-11 rounded-xl border border-primary/20 bg-[#2D1548]/60 px-4 text-sm outline-none"
              >
                {profile.cuentas.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.tipo_cuenta_nombre || "Cuenta"} — {account.numero_cuenta}
                    {account.banco_central_registrada ? "" : " ⚠"}
                  </option>
                ))}
              </select>

              {originNotRegistered && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Esta cuenta no está sincronizada con Brocoly. Las transferencias serán rechazadas por el Banco Central hasta que un administrador la sincronice.
                  </span>
                </div>
              )}
            </div>

            {/* Destinatarios guardados */}
            {profile.destinatarios.length > 0 && (
              <div className="grid gap-1">
                <label className="text-xs text-muted-foreground">Contactos guardados</label>
                <div className="flex flex-wrap gap-2">
                  {profile.destinatarios.map((dest) => (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => handleSelectRecipient(dest.cbu_externo, dest.alias)}
                      className="rounded-lg border border-primary/20 bg-[#2D1548]/50 px-3 py-1.5 text-left text-xs transition hover:bg-[#2D1548]/80"
                    >
                      <span className="block font-medium">{dest.alias || dest.cbu_externo}</span>
                      {dest.alias && (
                        <span className="block font-mono text-muted-foreground">{dest.cbu_externo}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CBU / Alias destino con lookup en Brocoly */}
            <div className="grid gap-1">
              <label className="text-xs text-muted-foreground">CBU o alias destino</label>
              <div className="relative">
                <Input
                  value={lookupInput}
                  onChange={(event) => {
                    setLookupInput(event.target.value);
                    if (!event.target.value.trim()) {
                      onTransferFormChange({ ...transferForm, cbuDestino: "" });
                      setResolvedRecipient(null);
                      setLookupState("idle");
                    }
                  }}
                  placeholder="Ej: juan.perez.orbital o 22 dígitos"
                  className="pr-9"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {lookupState === "loading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {lookupState === "found" && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                  {lookupState === "not_found" && <XCircle className="h-4 w-4 text-destructive" />}
                  {lookupState === "idle" && <Search className="h-4 w-4 text-muted-foreground" />}
                </span>
              </div>

              {lookupState === "found" && resolvedRecipient && (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs">
                  <p className="font-medium text-emerald-300">
                    {resolvedRecipient.titular || "Titular verificado en Brocoly"}
                  </p>
                  <p className="font-mono text-muted-foreground">{resolvedRecipient.cbu}</p>
                  {resolvedRecipient.banco && (
                    <p className="text-muted-foreground">{resolvedRecipient.banco}</p>
                  )}
                </div>
              )}

              {lookupState === "not_found" && lookupInput.trim() && (
                <p className="text-xs text-destructive">
                  No se encontró este CBU o alias en el Banco Central Brocoly.
                </p>
              )}
            </div>

            {/* Monto */}
            <div className="grid gap-1">
              <label className="text-xs text-muted-foreground">Monto</label>
              <Input
                value={transferForm.monto}
                onChange={(event) => onTransferFormChange({ ...transferForm, monto: event.target.value })}
                placeholder="0.00"
                type="number"
                min="0.01"
                step="0.01"
              />
            </div>

            {/* Descripción */}
            <Textarea
              value={transferForm.descripcion}
              onChange={(event) =>
                onTransferFormChange({ ...transferForm, descripcion: event.target.value })
              }
              placeholder="Descripción (opcional)"
              rows={2}
            />

            <Button
              type="submit"
              disabled={
                submitting ||
                !transferForm.cbuDestino ||
                lookupState === "loading" ||
                lookupState === "not_found" ||
                !transferForm.monto ||
                Number(transferForm.monto) <= 0
              }
            >
              {submitting ? "Procesando..." : "Transferir vía Brocoly"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Transferencias recibidas</span>
          <button
            type="button"
            onClick={onSyncIncoming}
            disabled={syncingIncoming}
            className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-[#2D1548]/60 px-3 py-1.5 text-xs text-primary transition hover:bg-[#2D1548] disabled:opacity-50"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${syncingIncoming ? "animate-spin" : ""}`} />
            {syncingIncoming ? "Consultando Brocoly..." : "Actualizar"}
          </button>
        </div>

        {lastSyncResult && lastSyncResult.synced === 0 && (
          <p className="text-xs text-muted-foreground">
            Sin transferencias nuevas en las últimas 24 h.
          </p>
        )}
        {lastSyncResult && lastSyncResult.synced > 0 && (
          <p className="text-xs text-emerald-400">
            {lastSyncResult.synced} nueva{lastSyncResult.synced !== 1 ? "s" : ""} transferencia{lastSyncResult.synced !== 1 ? "s" : ""} registrada{lastSyncResult.synced !== 1 ? "s" : ""}.
          </p>
        )}

        <RecentActivity activities={activities} loading={loading || syncingIncoming} />
      </div>
    </div>
  );
});
