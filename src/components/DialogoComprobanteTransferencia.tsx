import { CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter } from "./ui/dialog";
import { formatCurrency } from "../lib/utils/currency";
import type { Transaccion } from "../features/transacciones/types/transacciones.types";

interface DialogoComprobanteTransferenciaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaccion: Transaccion | null;
  /** Nombre del destinatario si lo conocemos (resuelto en el form). */
  nombreDestinatario?: string | null;
}

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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-right text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

/** Comprobante de transferencia exitosa, al estilo de un banco real. */
export function DialogoComprobanteTransferencia({
  open,
  onOpenChange,
  transaccion,
  nombreDestinatario,
}: DialogoComprobanteTransferenciaProps) {
  if (!transaccion) return null;

  const amount = Number(transaccion.monto || 0);
  const destino =
    transaccion.cuenta_destino_numero ||
    (transaccion.cbu_destino ? transaccion.cbu_destino : "—");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1C0B2E] border-primary/20 sm:max-w-md">
        {/* Encabezado de éxito */}
        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-emerald-200">¡Transferencia exitosa!</h2>
            <p className="text-xs text-muted-foreground">Tu comprobante quedó registrado.</p>
          </div>
          <p className="mt-1 text-3xl font-semibold text-primary">{formatCurrency(Math.abs(amount))}</p>
        </div>

        {/* Detalle */}
        <div className="mt-4 divide-y divide-primary/10 rounded-2xl border border-primary/15 bg-[#2D1548]/40 px-4">
          {nombreDestinatario && <Row label="Destinatario" value={nombreDestinatario} />}
          <Row label="Destino" value={destino} mono={destino !== "—"} />
          <Row label="Fecha y hora" value={formatDateTime(transaccion.created_at)} />
          <Row label="N° de operación" value={transaccion.id} mono />
          <Row label="Estado" value="Completada" />
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
