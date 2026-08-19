import { AlertTriangle, CheckCircle, Loader2, RefreshCcw, Search, XCircle } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RecentActivity } from "../../../components/RecentActivity";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import type { PersonaCompleta, ActividadDeUsuario } from "../../../lib/api";
import { transferenciaSchema, type FormularioTransferencia } from "../../../lib/schemas";
import { type DestinatarioResuelto, resolverDestinatario } from "../api/transacciones.api";
import type { SyncIncomingResult } from "../api/transacciones.api";

// Mantenido por compatibilidad con consumidores que aún lo importan.
export interface EstadoFormularioTransferencia {
  cuentaOrigenId: string;
  cbuDestino: string;
  monto: string;
  descripcion: string;
}

interface SeccionTransaccionesProps {
  activities: ActividadDeUsuario[];
  lastSyncResult: SyncIncomingResult | null;
  loading: boolean;
  onSubmit: (values: FormularioTransferencia) => Promise<void> | void;
  onSyncIncoming: () => void;
  perfil: PersonaCompleta;
  submitting: boolean;
  syncingIncoming: boolean;
  // El padre incrementa este número tras un submit OK para limpiar el form.
  resetSignal?: number;
  onSelectActivity?: (id: string) => void;
}

type LookupState = "idle" | "loading" | "found" | "not_found";

export const SeccionTransacciones = memo(function SeccionTransacciones({
  activities,
  lastSyncResult,
  loading,
  onSubmit,
  onSyncIncoming,
  perfil,
  submitting,
  syncingIncoming,
  resetSignal,
  onSelectActivity,
}: SeccionTransaccionesProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormularioTransferencia>({
    resolver: zodResolver(transferenciaSchema),
    mode: "onTouched",
    defaultValues: {
      cuentaOrigenId: perfil.cuentas[0]?.id || "",
      cbuDestino: "",
      monto: "",
      descripcion: "",
    },
  });

  const cuentaOrigenId = watch("cuentaOrigenId");
  const cbuDestino = watch("cbuDestino");
  const monto = watch("monto");

  // ── Lookup en Banco Central (alias o CBU) ────────────────────────────────────────
  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [destinatarioResuelto, setDestinatarioResuelto] = useState<DestinatarioResuelto | null>(null);
  const [lookupInput, setLookupInput] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-sync de transferencias entrantes al montar (best-effort).
  const syncCalledRef = useRef(false);
  useEffect(() => {
    if (!syncCalledRef.current) {
      syncCalledRef.current = true;
      onSyncIncoming();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runLookup(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setLookupState("idle");
      setDestinatarioResuelto(null);
      return;
    }

    setLookupState("loading");
    setDestinatarioResuelto(null);

    try {
      const isCbu = /^\d{10,22}$/.test(trimmed);
      const result = await resolverDestinatario(isCbu ? { cbu: trimmed } : { alias: trimmed });
      const cbu = result.cbu;

      if (cbu) {
        setDestinatarioResuelto(result);
        setLookupState("found");
        setValue("cbuDestino", cbu, { shouldValidate: true, shouldDirty: true });
      } else {
        setLookupState("not_found");
      }
    } catch {
      setLookupState("not_found");
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runLookup(lookupInput), 900);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupInput]);

  // Reset cuando el padre lo solicita (post-submit exitoso).
  useEffect(() => {
    if (resetSignal === undefined) return;
    reset({
      cuentaOrigenId: perfil.cuentas[0]?.id || "",
      cbuDestino: "",
      monto: "",
      descripcion: "",
    });
    setLookupInput("");
    setLookupState("idle");
    setDestinatarioResuelto(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  function manejarSeleccionarDestinatario(cbu: string, alias?: string | null) {
    const displayValue = alias || cbu;
    setLookupInput(displayValue);
    setValue("cbuDestino", cbu, { shouldValidate: true, shouldDirty: true });
  }

  const selectedOrigin = perfil.cuentas.find((cuenta) => cuenta.id === cuentaOrigenId);
  const originNotRegistered = selectedOrigin && selectedOrigin.banco_central_registrada === false;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
        <CardHeader>
          <CardTitle>Realizar transferencia</CardTitle>
          <CardDescription>
            Ingresá CBU o alias. Las transferencias a cuentas Orbital se acreditan al instante; a otros bancos son procesadas por la red interbancaria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-1">
              <label className="text-xs text-muted-foreground">Cuenta origen</label>
              <select
                {...register("cuentaOrigenId")}
                className="h-11 rounded-xl border border-primary/20 bg-[#2D1548]/60 px-4 text-sm outline-none"
              >
                {perfil.cuentas.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {cuenta.tipo_cuenta_nombre || "Cuenta"} — {cuenta.numero_cuenta}
                    {cuenta.banco_central_registrada ? "" : " ⚠"}
                  </option>
                ))}
              </select>
              {errors.cuentaOrigenId && (
                <span className="text-xs text-destructive">{errors.cuentaOrigenId.message}</span>
              )}

              {originNotRegistered && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Esta cuenta todavía no está habilitada para transferencias a otros bancos. Comunicate con el banco para activarla.
                  </span>
                </div>
              )}
            </div>

            {perfil.destinatarios.length > 0 && (
              <div className="grid gap-1">
                <label className="text-xs text-muted-foreground">Contactos guardados</label>
                <div className="flex flex-wrap gap-2">
                  {perfil.destinatarios.map((dest) => (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => manejarSeleccionarDestinatario(dest.cbu_externo, dest.alias)}
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

            <div className="grid gap-1">
              <label className="text-xs text-muted-foreground">CBU o alias destino</label>
              <div className="relative">
                <Input
                  value={lookupInput}
                  onChange={(event) => {
                    setLookupInput(event.target.value);
                    if (!event.target.value.trim()) {
                      setValue("cbuDestino", "", { shouldValidate: true });
                      setDestinatarioResuelto(null);
                      setLookupState("idle");
                    }
                  }}
                  placeholder="alias.bancario o CBU de 22 dígitos"
                  className="pr-9"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {lookupState === "loading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {lookupState === "found" && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                  {lookupState === "not_found" && <XCircle className="h-4 w-4 text-destructive" />}
                  {lookupState === "idle" && <Search className="h-4 w-4 text-muted-foreground" />}
                </span>
              </div>

              {lookupState === "found" && destinatarioResuelto && (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs">
                  <p className="font-medium text-emerald-300">
                    {destinatarioResuelto.titular || "Titular verificado"}
                  </p>
                  <p className="font-mono text-muted-foreground">{destinatarioResuelto.cbu}</p>
                  {destinatarioResuelto.banco && (
                    <p className="text-muted-foreground">{destinatarioResuelto.banco}</p>
                  )}
                </div>
              )}

              {lookupState === "not_found" && lookupInput.trim() && (
                <p className="text-xs text-destructive">
                  No encontramos ningún titular con este CBU o alias. Verificá los datos.
                </p>
              )}
              {errors.cbuDestino && lookupState !== "loading" && (
                <span className="text-xs text-destructive">{errors.cbuDestino.message}</span>
              )}
            </div>

            <div className="grid gap-1">
              <label className="text-xs text-muted-foreground">Monto</label>
              <Input
                {...register("monto")}
                placeholder="0.00"
                type="number"
                min="0.01"
                step="0.01"
                aria-invalid={errors.monto ? "true" : "false"}
              />
              {errors.monto && (
                <span className="text-xs text-destructive">{errors.monto.message}</span>
              )}
            </div>

            <Textarea
              {...register("descripcion")}
              placeholder="Descripción (opcional)"
              rows={2}
            />
            {errors.descripcion && (
              <span className="text-xs text-destructive">{errors.descripcion.message}</span>
            )}

            <Button
              type="submit"
              disabled={
                submitting ||
                !cbuDestino ||
                lookupState === "loading" ||
                lookupState === "not_found" ||
                !monto ||
                Number(monto) <= 0
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar transferencia"
              )}
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
            {syncingIncoming ? "Buscando..." : "Actualizar"}
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

        <RecentActivity activities={activities} loading={loading || syncingIncoming} onSelect={onSelectActivity} />
      </div>
    </div>
  );
});
