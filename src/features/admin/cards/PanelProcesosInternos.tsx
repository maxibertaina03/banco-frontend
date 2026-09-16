import { CalendarClock, Gavel } from "lucide-react";
import { useState } from "react";
import { Aviso, Boton, Panel, mensajeDeError } from "../../../components/operaciones/ui";
import { useActualizarMora, useMarcarPlazosFijosVencidos } from "../../../lib/queries";

/**
 * Los dos procesos que en un banco correrían de noche por su cuenta. Acá se
 * disparan a mano, que fue la decisión para v1: sin scheduler, pero con el
 * efecto explícito y visible.
 *
 * El de mora no es inocuo: informa la situación crediticia al Banco Central, y
 * eso le queda al cliente en la Central de Deudores. Por eso pide confirmación.
 */
export function PanelProcesosInternos() {
  const mora = useActualizarMora();
  const vencidos = useMarcarPlazosFijosVencidos();
  const [confirmandoMora, setConfirmandoMora] = useState(false);

  return (
    <Panel
      title="Procesos internos"
      description="Tareas diarias del banco. Se ejecutan cuando las disparás, no solas."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid content-start gap-3 rounded-2xl bg-[#2D1548]/60 p-4">
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-primary" />
            <p className="font-medium">Barrido de mora</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Marca en mora los préstamos con cuotas vencidas hace más de 30 días e informa la situación al
            Banco Central. Queda asentado en la Central de Deudores del cliente.
          </p>

          {confirmandoMora ? (
            <div className="grid gap-2">
              <Aviso tipo="atencion">Esto informa deuda al Banco Central. ¿Seguro?</Aviso>
              <div className="flex flex-wrap gap-2">
                <Boton
                  variante="peligro"
                  cargando={mora.isPending}
                  onClick={() => mora.mutate(undefined, { onSuccess: () => setConfirmandoMora(false) })}
                >
                  Sí, ejecutar
                </Boton>
                <Boton variante="secundario" onClick={() => setConfirmandoMora(false)}>
                  Cancelar
                </Boton>
              </div>
            </div>
          ) : (
            <Boton variante="secundario" onClick={() => setConfirmandoMora(true)}>
              Ejecutar barrido
            </Boton>
          )}

          {mora.isError && <Aviso tipo="error">{mensajeDeError(mora.error)}</Aviso>}
          {mora.isSuccess && (
            <Aviso tipo={mora.data.errores > 0 ? "atencion" : "exito"}>
              {mora.data.revisados === 0
                ? "No había préstamos con cuotas vencidas."
                : `Revisados ${mora.data.revisados}, marcados en mora ${mora.data.en_mora}, informados al Central ${mora.data.informados}.`}
              {mora.data.errores > 0 && ` ${mora.data.errores} no se pudieron informar: volvé a ejecutarlo más tarde.`}
            </Aviso>
          )}
        </div>

        <div className="grid content-start gap-3 rounded-2xl bg-[#2D1548]/60 p-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <p className="font-medium">Plazos fijos vencidos</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Pasa a vencidos los que llegaron a su fecha, para que el cliente los vea listos para cobrar. No
            acredita nada: la acreditación la pide él.
          </p>
          <Boton variante="secundario" cargando={vencidos.isPending} onClick={() => vencidos.mutate()}>
            Marcar vencidos
          </Boton>

          {vencidos.isError && <Aviso tipo="error">{mensajeDeError(vencidos.error)}</Aviso>}
          {vencidos.isSuccess && (
            <Aviso tipo="exito">
              {vencidos.data.vencidos === 0 ? "No había plazos fijos por vencer hoy." : `Marcados ${vencidos.data.vencidos}.`}
            </Aviso>
          )}
        </div>
      </div>
    </Panel>
  );
}
