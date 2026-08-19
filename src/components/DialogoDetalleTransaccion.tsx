import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { formatCurrency } from "../lib/utils/currency";
import type { Transaccion } from "../features/transacciones/types/transacciones.types";
import type { PersonaCompleta } from "../features/personas/types/personas.types";

interface DialogoDetalleTransaccionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaccion: Transaccion | null;
  /** Perfil del usuario logueado (para resolver nombres de origen/destino). */
  perfil: PersonaCompleta | null;
}

const ESTADO_STYLE: Record<string, string> = {
  completada: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  pendiente: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  rechazada: "border-destructive/40 bg-destructive/10 text-destructive",
};

const ESTADO_LABEL: Record<string, string> = {
  completada: "Completada",
  pendiente: "Pendiente",
  rechazada: "Rechazada",
};

const CANAL_LABEL: Record<string, string> = {
  local: "Transferencia interna (Orbital)",
  interbancaria_saliente: "Enviada a otro banco",
  interbancaria_entrante: "Recibida de otro banco",
  deposito_efectivo: "Depósito en efectivo",
};

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function Row({
  label,
  value,
  mono,
  sub,
}: {
  label: string;
  value: string;
  mono?: boolean;
  sub?: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className={`text-sm ${mono ? "font-mono break-all" : ""}`}>{value}</span>
        {sub && <p className="font-mono text-xs text-muted-foreground break-all">{sub}</p>}
      </div>
    </div>
  );
}

/** Detalle completo de un movimiento, al tocar sobre él en la lista. */
export function DialogoDetalleTransaccion({
  open,
  onOpenChange,
  transaccion,
  perfil,
}: DialogoDetalleTransaccionProps) {
  if (!transaccion) return null;

  const cuentas = perfil?.cuentas ?? [];
  const idsCuenta = new Set(cuentas.map((a) => a.id));
  const userName =
    `${perfil?.persona.nombre ?? ""} ${perfil?.persona.apellido ?? ""}`.trim() || null;

  const incoming =
    transaccion.canal === "interbancaria_entrante" ||
    (Boolean(transaccion.cuenta_destino_id) &&
      idsCuenta.has(transaccion.cuenta_destino_id as string) &&
      !idsCuenta.has(transaccion.cuenta_origen_id as string));

  const amount = Number(transaccion.monto || 0);
  const estado = transaccion.estado || "completada";

  // Referencia técnica (número de cuenta / CBU) de cada lado.
  const origenRef = transaccion.cuenta_origen_numero || transaccion.cbu_origen || null;
  const destinoRef = transaccion.cuenta_destino_numero || transaccion.cbu_destino || null;

  // Nombre de cada lado: si la cuenta es del usuario logueado → su nombre;
  // si el destino coincide con un destinatario guardado → su alias; si no, null.
  const originIsUser = Boolean(transaccion.cuenta_origen_id && idsCuenta.has(transaccion.cuenta_origen_id));
  const destIsUser = Boolean(transaccion.cuenta_destino_id && idsCuenta.has(transaccion.cuenta_destino_id));
  const savedDest = perfil?.destinatarios?.find((d) => d.cbu_externo === transaccion.cbu_destino);

  const origenName = originIsUser ? userName : null;
  const destinoName = destIsUser ? userName : savedDest?.alias ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1C0B2E] border-primary/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalle del movimiento</DialogTitle>
        </DialogHeader>

        {/* Cabecera: ícono dirección + monto + estado */}
        <div className="flex flex-col items-center gap-2 pb-2 text-center">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
              incoming ? "bg-emerald-500/15 text-emerald-400" : "bg-primary/15 text-primary"
            }`}
          >
            {incoming ? <ArrowDownLeft className="h-7 w-7" /> : <ArrowUpRight className="h-7 w-7" />}
          </div>
          <p className={`text-2xl font-semibold ${incoming ? "text-emerald-400" : "text-foreground"}`}>
            {incoming ? "+" : "-"}
            {formatCurrency(Math.abs(amount))}
          </p>
          <span className={`rounded-full border px-3 py-0.5 text-xs ${ESTADO_STYLE[estado] || ESTADO_STYLE.completada}`}>
            {ESTADO_LABEL[estado] || estado}
          </span>
        </div>

        <div className="divide-y divide-primary/10 rounded-2xl border border-primary/15 bg-[#2D1548]/40 px-4">
          <Row label="Tipo" value={transaccion.tipo_transaccion_nombre || "Movimiento"} />
          {transaccion.canal && (
            <Row label="Canal" value={CANAL_LABEL[transaccion.canal] || transaccion.canal} />
          )}
          <Row
            label="Origen"
            value={origenName || origenRef || "—"}
            sub={origenName ? origenRef : null}
            mono={!origenName && Boolean(origenRef)}
          />
          <Row
            label="Destino"
            value={destinoName || destinoRef || "—"}
            sub={destinoName ? destinoRef : null}
            mono={!destinoName && Boolean(destinoRef)}
          />
          {transaccion.descripcion && <Row label="Descripción" value={transaccion.descripcion} />}
          <Row label="Fecha y hora" value={formatDateTime(transaccion.created_at)} />
          <Row label="N° de operación" value={transaccion.id} mono />
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
