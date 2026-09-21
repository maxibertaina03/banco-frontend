import { Check, Download } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "./ui/dialog";
import logo from "../imports/image-3.png";
import type { RespuestaTransferencia } from "../features/transacciones/types/transacciones.types";
import {
  filasDelComprobante,
  imprimirComprobante,
  montoDelComprobante,
} from "../features/transacciones/comprobante/comprobante";

interface DialogoComprobanteTransferenciaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comprobante: RespuestaTransferencia | null;
}

/** Comprobante de una transferencia recién hecha, con opción de guardarlo en PDF. */
export function DialogoComprobanteTransferencia({
  open,
  onOpenChange,
  comprobante,
}: DialogoComprobanteTransferenciaProps) {
  if (!comprobante) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Columna: el detalle scrollea en su zona y los botones quedan fuera del
          scroll. En el celular el comprobante es más alto que la pantalla, y
          si los botones iban adentro quedaban escondidos al final. */}
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden border-primary/20 bg-[#1C0B2E] p-0 sm:max-w-md">
        <div className="overflow-y-auto px-6 pb-5 pt-6">
          <div className="flex flex-col items-center pt-2 text-center">
            <img
              src={logo}
              alt="Orbital"
              className="h-7 object-contain opacity-90"
            />

            <div className="mt-4 flex h-14 w-14 items-center sm:mt-6 sm:h-16 sm:w-16 justify-center rounded-full bg-gradient-to-br from-[#A855F7] to-[#7C3AED] shadow-lg shadow-purple-700/40">
              <Check
                className="h-7 w-7 text-white sm:h-8 sm:w-8"
                strokeWidth={3}
              />
            </div>

            <DialogTitle className="mt-4 text-xl font-semibold">
              ¡Transferencia exitosa!
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Comprobante de la operación
            </DialogDescription>

            <p className="mt-4 bg-gradient-to-r from-[#E9D5FF] to-[#A855F7] bg-clip-text text-3xl font-bold text-transparent sm:mt-5 sm:text-4xl">
              {montoDelComprobante(comprobante)}
            </p>
          </div>

          <dl className="mt-4 divide-y divide-primary/10 rounded-2xl border border-dashed border-primary/30 bg-[#2D1548]/30 px-4">
            {filasDelComprobante(comprobante).map((fila) => (
              <div
                key={fila.etiqueta}
                className="flex items-start justify-between gap-4 py-2.5"
              >
                <dt className="shrink-0 text-xs text-muted-foreground">
                  {fila.etiqueta}
                </dt>
                <dd
                  className={`break-all text-right font-medium ${fila.mono ? "font-mono text-xs sm:text-[13px]" : "text-sm"}`}
                >
                  {fila.valor}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <DialogFooter className="gap-2 border-t border-primary/10 px-6 py-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:flex-1"
            onClick={() => imprimirComprobante(comprobante)}
          >
            <Download className="h-4 w-4" />
            Guardar PDF
          </Button>
          <Button
            type="button"
            className="w-full sm:flex-1"
            onClick={() => onOpenChange(false)}
          >
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
