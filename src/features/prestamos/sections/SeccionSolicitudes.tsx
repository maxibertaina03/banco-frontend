import { useState } from "react";
import { Check, Clock, X } from "lucide-react";
import {
  Aviso,
  Boton,
  Dato,
  Panel,
  Vacio,
  mensajeDeError,
} from "../../../components/operaciones/ui";
import { useResolverSolicitud, useSolicitudesPendientes } from "../../../lib/queries";
import { formatCurrency, formatFecha } from "../../../lib/utils/currency";
import type { SolicitudPendiente } from "../api/solicitudes.api";

/** Qué significa cada situación de la Central de Deudores, en castellano. */
const SITUACIONES: Record<number, string> = {
  1: "Normal, sin atrasos",
  2: "Riesgo bajo: atrasos de hasta 90 días",
  3: "Riesgo medio: atrasos de hasta 180 días",
  4: "Riesgo alto: atrasos de más de un año",
  5: "Irrecuperable",
};

/**
 * La bandeja del gerente.
 *
 * Acá llega lo que el filtro automático no aprobó: mala situación en la Central
 * de Deudores, o el Banco Central sin responder. El cliente todavía no recibió
 * un peso; la plata se acredita recién cuando alguien aprueba.
 */
export function SeccionSolicitudes({ habilitado }: { habilitado: boolean }) {
  const solicitudes = useSolicitudesPendientes(habilitado);
  // La mutación y el aviso viven acá, no en la tarjeta.
  //
  // Al resolver, la solicitud sale de la lista y su tarjeta se desmonta. React
  // Query descarta los callbacks de una mutación cuyo componente ya no existe,
  // así que desde la tarjeta el aviso nunca llegaba a mostrarse: la fila
  // desaparecía sin decir nada. La sección no se desmonta.
  const resolver = useResolverSolicitud();
  const [resuelta, setResuelta] = useState<{ nombre: string; aprobada: boolean } | null>(null);

  function resolverSolicitud(solicitud: SolicitudPendiente, aprobar: boolean, motivo: string) {
    setResuelta(null);
    resolver.mutate(
      { prestamoId: solicitud.id, aprobar, motivo },
      {
        onSuccess: () =>
          setResuelta({
            nombre: `${solicitud.solicitante.nombre} ${solicitud.solicitante.apellido}`,
            aprobada: aprobar,
          }),
      }
    );
  }

  return (
    <div className="grid gap-6">
      <Panel
        title="Solicitudes de préstamo"
        description="Pedidos que el filtro automático no pudo aprobar. Hasta que decidas, el cliente no recibió el dinero."
      >
        {resuelta && (
          <div className="mb-4">
            <Aviso tipo={resuelta.aprobada ? "exito" : "atencion"}>
              Solicitud de {resuelta.nombre} {resuelta.aprobada ? "aprobada" : "rechazada"}.
              {resuelta.aprobada ? " El dinero ya está acreditado en su cuenta." : ""} Quedó
              registrada con tu nombre y el motivo.
            </Aviso>
          </div>
        )}

        {solicitudes.isError && <Aviso tipo="error">{mensajeDeError(solicitudes.error)}</Aviso>}
        {solicitudes.isLoading && <Vacio>Buscando solicitudes…</Vacio>}
        {solicitudes.data?.count === 0 && <Vacio>No hay solicitudes esperando. Todo al día.</Vacio>}

        <div className="grid gap-4">
          {solicitudes.data?.data.map((solicitud) => (
            <Solicitud
              key={solicitud.id}
              solicitud={solicitud}
              enviando={resolver.isPending}
              error={resolver.isError ? mensajeDeError(resolver.error) : null}
              onConfirmar={(aprobar, motivo) => resolverSolicitud(solicitud, aprobar, motivo)}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Solicitud({
  solicitud,
  enviando,
  error,
  onConfirmar,
}: {
  solicitud: SolicitudPendiente;
  enviando: boolean;
  error: string | null;
  onConfirmar: (aprobar: boolean, motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  // `null` mientras no eligió; después, qué va a hacer.
  const [decision, setDecision] = useState<"aprobar" | "rechazar" | null>(null);

  const motivoValido = motivo.trim().length >= 10;
  const situacion = solicitud.situacion_al_solicitar;

  function confirmar() {
    if (!decision || !motivoValido) return;
    onConfirmar(decision === "aprobar", motivo.trim());
  }

  return (
    <article className="rounded-2xl border border-primary/15 bg-[#1C0B2E] p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">
            {solicitud.solicitante.nombre} {solicitud.solicitante.apellido}
          </p>
          <p className="text-xs text-muted-foreground">
            DNI {solicitud.solicitante.dni ?? "—"} · {solicitud.solicitante.email ?? "sin correo"}
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
          <Clock className="h-3.5 w-3.5" />
          Pedido el {formatFecha(solicitud.created_at)}
        </span>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Dato label="Capital" valor={formatCurrency(solicitud.capital, solicitud.moneda)} destacado />
        <Dato label="Cuotas" valor={solicitud.cuotas} />
        <Dato label="Cuota mensual" valor={formatCurrency(solicitud.cuota_mensual, solicitud.moneda)} />
        <Dato label="Total a pagar" valor={formatCurrency(solicitud.total_a_pagar, solicitud.moneda)} />
      </div>

      {/* Por qué cayó acá. Es el dato que define la decisión. */}
      <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-sm">
        {situacion === null ? (
          <p className="text-amber-200">
            No se pudo consultar el Banco Central cuando pidió el préstamo. No sabemos su situación
            crediticia: conviene verificarla antes de aprobar.
          </p>
        ) : (
          <p className="text-amber-200">
            Situación <span className="font-semibold">{situacion}</span> en la Central de Deudores:{" "}
            {SITUACIONES[situacion] ?? "sin descripción"}.
          </p>
        )}
      </div>

      {error && (
        <div className="mt-3">
          <Aviso tipo="error">{error}</Aviso>
        </div>
      )}

      {decision ? (
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">
              Motivo de la decisión — queda en la auditoría, con tu nombre
            </span>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              maxLength={500}
              autoFocus
              placeholder={
                decision === "aprobar"
                  ? "Por ejemplo: cliente histórico, la deuda informada corresponde a un tercero."
                  : "Por ejemplo: la situación en la Central no permite otorgar en este momento."
              }
              className="w-full rounded-xl border border-primary/20 bg-[#2D1548]/60 p-3 text-sm outline-none transition focus:border-primary/60"
            />
            {motivo.length > 0 && !motivoValido && (
              <span className="text-xs text-destructive">Escribí al menos 10 caracteres.</span>
            )}
          </label>

          <div className="flex flex-wrap gap-2">
            <Boton
              variante={decision === "aprobar" ? "primario" : "peligro"}
              cargando={enviando}
              disabled={!motivoValido}
              onClick={confirmar}
            >
              Confirmar {decision === "aprobar" ? "aprobación" : "rechazo"}
            </Boton>
            <Boton
              variante="secundario"
              onClick={() => {
                setDecision(null);
                setMotivo("");
              }}
            >
              Cancelar
            </Boton>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <Boton onClick={() => setDecision("aprobar")}>
            <Check className="h-4 w-4" />
            Aprobar
          </Boton>
          <Boton variante="peligro" onClick={() => setDecision("rechazar")}>
            <X className="h-4 w-4" />
            Rechazar
          </Boton>
        </div>
      )}
    </article>
  );
}
