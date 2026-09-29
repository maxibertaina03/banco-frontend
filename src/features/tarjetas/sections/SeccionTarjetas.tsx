import { Check, CreditCard, Lock, Sparkles, Unlock } from "lucide-react";
import { useState } from "react";
import {
  Aviso,
  Boton,
  Campo,
  Dato,
  Entrada,
  Panel,
  Select,
  Vacio,
  etiquetaDeCuenta,
  mensajeDeError,
  parsearMonto,
  useClaveIdempotencia,
} from "../../../components/operaciones/ui";
import type { PersonaCompleta } from "../../../lib/api";
import {
  useAutorizarConsumo,
  useCambiarEstadoTarjeta,
  useEmitirTarjeta,
  useOfertaDeNiveles,
  useResumenTarjeta,
  useTarjetas,
} from "../../../lib/queries";
import { formatCurrency, formatFecha, formatMontoRedondo } from "../../../lib/utils/currency";
import type { Autorizacion, NivelOfrecido, NivelTarjeta, Tarjeta } from "../types/tarjetas.types";

/**
 * Cada nivel se ve distinto, como en la vida real: el plástico es parte del
 * producto. El degradado del <Plastico> y el acento de la ficha del nivel.
 */
const ESTILO_NIVEL: Record<NivelTarjeta, { plastico: string; acento: string; chip: string }> = {
  standard: {
    plastico: "bg-gradient-to-br from-[#1F2937] via-[#374151] to-[#4B5563]",
    acento: "border-[#94A3B8]/40",
    chip: "bg-[#94A3B8]/15 text-[#CBD5E1]",
  },
  gold: {
    plastico: "bg-gradient-to-br from-[#6B4E0F] via-[#B08A2E] to-[#E8C97A]",
    acento: "border-[#E8C97A]/50",
    chip: "bg-[#E8C97A]/15 text-[#E8C97A]",
  },
  platinum: {
    plastico: "bg-gradient-to-br from-[#3F4A5A] via-[#8C9AAD] to-[#D7DEE8]",
    acento: "border-[#D7DEE8]/50",
    chip: "bg-[#D7DEE8]/15 text-[#E4EAF2]",
  },
  black: {
    plastico: "bg-gradient-to-br from-[#000000] via-[#141417] to-[#3A3A40]",
    acento: "border-white/30",
    chip: "bg-white/10 text-white",
  },
};

/** Las viejas tarjetas de crédito sin nivel conservan el diseño original. */
const PLASTICO_CREDITO_SIN_NIVEL = "bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#312E81]";
const PLASTICO_DEBITO = "bg-gradient-to-br from-[#4C1D95] via-[#6D28D9] to-[#A855F7]";

export function SeccionTarjetas({ perfil }: { perfil: PersonaCompleta }) {
  const tarjetas = useTarjetas(perfil.persona.id);
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);
  const seleccionada = tarjetas.data?.find((t) => t.id === seleccionadaId) ?? tarjetas.data?.[0] ?? null;

  return (
    <div className="grid gap-6">
      <Panel title="Mis tarjetas" description="Tocá una tarjeta para ver su detalle.">
        {tarjetas.isError && <Aviso tipo="error">{mensajeDeError(tarjetas.error)}</Aviso>}
        {tarjetas.isLoading && <Vacio>Cargando tarjetas…</Vacio>}
        {tarjetas.data?.length === 0 && <Vacio>Todavía no tenés tarjetas. Pedí una abajo.</Vacio>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tarjetas.data?.map((t) => (
            <Plastico
              key={t.id}
              tarjeta={t}
              titular={`${perfil.persona.nombre} ${perfil.persona.apellido}`}
              activa={seleccionada?.id === t.id}
              onClick={() => setSeleccionadaId(t.id)}
            />
          ))}
        </div>
      </Panel>

      {seleccionada && (
        <div className="grid gap-6 lg:grid-cols-2">
          <DetalleTarjeta tarjeta={seleccionada} perfil={perfil} />
          {seleccionada.tipo === "credito" ? <ResumenCredito tarjetaId={seleccionada.id} /> : <InfoDebito tarjeta={seleccionada} perfil={perfil} />}
        </div>
      )}

      <PedirTarjeta perfil={perfil} onEmitida={(t) => setSeleccionadaId(t.id)} />
    </div>
  );
}

function Plastico({ tarjeta, titular, activa, onClick }: { tarjeta: Tarjeta; titular: string; activa: boolean; onClick: () => void }) {
  const inactiva = tarjeta.estado !== "activa";
  const fondo =
    tarjeta.tipo === "debito" ? PLASTICO_DEBITO : tarjeta.nivel ? ESTILO_NIVEL[tarjeta.nivel].plastico : PLASTICO_CREDITO_SIN_NIVEL;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={`relative aspect-[1.586] w-full max-w-full overflow-hidden rounded-3xl p-5 text-left text-white transition ${fondo} ${
        activa ? "ring-2 ring-primary ring-offset-2 ring-offset-[#1C0B2E]" : "opacity-90 hover:opacity-100"
      } ${inactiva ? "grayscale" : ""}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-sm text-white/80">
          Orbital {tarjeta.tipo === "credito" ? "Crédito" : "Débito"}
          {tarjeta.nivel_nombre ? <span className="font-medium"> · {tarjeta.nivel_nombre}</span> : null}
        </span>
        {inactiva ? (
          <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs capitalize">{tarjeta.estado}</span>
        ) : (
          <CreditCard className="h-5 w-5 text-white/70" />
        )}
      </div>
      {/* Más chico en pantallas angostas: a 360px el número no entraba, el
          "8281" bajaba de renglón y quedaba encima de "Titular". */}
      <p className="mt-6 whitespace-nowrap font-mono text-base tracking-[0.12em] sm:text-xl sm:tracking-[0.2em]">{tarjeta.numero_enmascarado}</p>
      <div className="absolute inset-x-5 bottom-4 flex items-end justify-between text-xs">
        <div>
          <p className="text-white/60">Titular</p>
          <p className="uppercase">{titular}</p>
        </div>
        <div className="text-right">
          <p className="text-white/60">Vence</p>
          <p>{tarjeta.vencimiento ?? "—"}</p>
        </div>
      </div>
    </button>
  );
}

function DetalleTarjeta({ tarjeta, perfil }: { tarjeta: Tarjeta; perfil: PersonaCompleta }) {
  const cambiarEstado = useCambiarEstadoTarjeta();
  const bloqueada = tarjeta.estado === "bloqueada";

  return (
    <Panel
      title={`Tarjeta de ${tarjeta.tipo === "credito" ? "crédito" : "débito"} ${tarjeta.numero_enmascarado.slice(-4)}`}
      actions={
        tarjeta.estado !== "vencida" && (
          <Boton
            variante={bloqueada ? "secundario" : "peligro"}
            cargando={cambiarEstado.isPending}
            onClick={() => cambiarEstado.mutate({ tarjetaId: tarjeta.id, accion: bloqueada ? "desbloquear" : "bloquear" })}
          >
            {bloqueada ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {bloqueada ? "Desbloquear" : "Bloquear"}
          </Boton>
        )
      }
    >
      {cambiarEstado.isError && <Aviso tipo="error">{mensajeDeError(cambiarEstado.error)}</Aviso>}
      {tarjeta.tipo === "credito" && tarjeta.limite !== null && (
        <div className="mb-5">
          <div className="grid grid-cols-2 gap-3">
            <Dato label="Disponible" valor={formatCurrency(tarjeta.disponible ?? tarjeta.limite)} destacado />
            <Dato label="Límite" valor={formatCurrency(tarjeta.limite)} />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#2D1548]">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, Math.max(0, (1 - (tarjeta.disponible ?? tarjeta.limite) / tarjeta.limite) * 100))}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Consumido en el período</p>
        </div>
      )}
      {tarjeta.beneficios && tarjeta.beneficios.length > 0 && (
        <div className={`mb-5 rounded-2xl border bg-[#1C0B2E]/60 p-4 ${tarjeta.nivel ? ESTILO_NIVEL[tarjeta.nivel].acento : "border-primary/15"}`}>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            Beneficios {tarjeta.nivel_nombre}
          </p>
          <ul className="grid gap-1.5">
            {tarjeta.beneficios.map((b) => (
              <li key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <SimularConsumo tarjeta={tarjeta} personaId={perfil.persona.id} />
    </Panel>
  );
}

/**
 * Simula una compra en un comercio. En un banco real esto lo dispara la red de
 * pagos; acá sirve para probar la autorización y ver el rechazo con su motivo.
 */
function SimularConsumo({ tarjeta, personaId }: { tarjeta: Tarjeta; personaId: string }) {
  const [comercio, setComercio] = useState("");
  const [montoTexto, setMontoTexto] = useState("");
  const [cuotas, setCuotas] = useState(1);
  const [resultado, setResultado] = useState<Autorizacion | null>(null);
  const autorizar = useAutorizarConsumo(personaId);
  const [clave, renovarClave] = useClaveIdempotencia();
  const monto = parsearMonto(montoTexto);

  if (tarjeta.estado !== "activa") {
    return <Aviso tipo="atencion">La tarjeta está {tarjeta.estado}: no se pueden hacer consumos.</Aviso>;
  }

  return (
    <form
      className="grid gap-3 border-t border-primary/10 pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!monto || !comercio.trim()) return;
        setResultado(null);
        autorizar.mutate(
          { tarjetaId: tarjeta.id, comercio: comercio.trim(), monto, cuotas: tarjeta.tipo === "credito" ? cuotas : 1, idempotencyKey: clave },
          {
            onSuccess: (a) => {
              setResultado(a);
              renovarClave();
              if (a.estado === "aprobada") {
                setComercio("");
                setMontoTexto("");
              }
            },
          }
        );
      }}
    >
      <p className="text-sm font-medium">Simular una compra</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Comercio">
          <Entrada value={comercio} onChange={(e) => setComercio(e.target.value)} placeholder="Supermercado Norte" maxLength={80} />
        </Campo>
        <Campo label="Monto (ARS)">
          <Entrada inputMode="decimal" value={montoTexto} onChange={(e) => setMontoTexto(e.target.value)} placeholder="0,00" />
        </Campo>
      </div>
      {tarjeta.tipo === "credito" && (
        <Campo label="Cuotas">
          <Select value={cuotas} onChange={(e) => setCuotas(Number(e.target.value))}>
            {[1, 3, 6, 12, 18, 24].map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "1 pago" : `${n} cuotas`}
              </option>
            ))}
          </Select>
        </Campo>
      )}
      {autorizar.isError && <Aviso tipo="error">{mensajeDeError(autorizar.error)}</Aviso>}
      {resultado?.estado === "aprobada" && (
        <Aviso tipo="exito">
          Compra aprobada en {resultado.comercio} por {formatCurrency(resultado.monto)}.
        </Aviso>
      )}
      {resultado?.estado === "rechazada" && <Aviso tipo="error">Compra rechazada: {resultado.motivo_rechazo}</Aviso>}
      <Boton type="submit" variante="secundario" cargando={autorizar.isPending} disabled={!monto || !comercio.trim()}>
        Pagar con la tarjeta
      </Boton>
    </form>
  );
}

function ResumenCredito({ tarjetaId }: { tarjetaId: string }) {
  const resumen = useResumenTarjeta(tarjetaId);
  return (
    <Panel title="Resumen del período" description={resumen.data ? `Período ${resumen.data.periodo}` : undefined}>
      {resumen.isError && <Aviso tipo="error">{mensajeDeError(resumen.error)}</Aviso>}
      {resumen.data && (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Dato label="Total a pagar" valor={formatCurrency(resumen.data.total_a_pagar)} destacado />
            <Dato label="Pago mínimo" valor={formatCurrency(resumen.data.pago_minimo)} />
            <Dato label="Vencimiento" valor={formatFecha(resumen.data.vencimiento)} />
            <Dato label="Consumos" valor={resumen.data.consumos.length} />
          </div>
          {resumen.data.consumos.length === 0 ? (
            <Vacio>No hay consumos en este período.</Vacio>
          ) : (
            <ul className="divide-y divide-primary/10">
              {resumen.data.consumos.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p>{c.comercio}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFecha(c.created_at)}
                      {c.cuotas > 1 ? ` · ${c.cuotas} cuotas` : ""}
                    </p>
                  </div>
                  <span>{formatCurrency(c.monto)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Panel>
  );
}

function InfoDebito({ tarjeta, perfil }: { tarjeta: Tarjeta; perfil: PersonaCompleta }) {
  const cuenta = perfil.cuentas.find((c) => c.id === tarjeta.cuenta_id);
  return (
    <Panel title="Cuenta asociada" description="Los consumos se debitan al instante de esta cuenta y aparecen en sus movimientos.">
      {cuenta ? <Dato label={etiquetaDeCuenta(cuenta).split(" · ")[0]} valor={formatCurrency(Number(cuenta.saldo), cuenta.moneda ?? "ARS")} destacado /> : <Vacio>No se encontró la cuenta asociada.</Vacio>}
    </Panel>
  );
}

function PedirTarjeta({ perfil, onEmitida }: { perfil: PersonaCompleta; onEmitida: (t: Tarjeta) => void }) {
  const cuentasEnPesos = perfil.cuentas.filter((c) => (c.moneda ?? "ARS") === "ARS" && c.activa);
  const [tipo, setTipo] = useState<"debito" | "credito">("debito");
  const [cuentaId, setCuentaId] = useState(cuentasEnPesos[0]?.id ?? "");
  const [nivel, setNivel] = useState<NivelTarjeta | null>(null);
  const emitir = useEmitirTarjeta(perfil.persona.id);

  // Sólo se consulta cuando hace falta: pregunta al Banco Central por la
  // situación crediticia y no tiene sentido hacerlo para pedir un débito.
  const oferta = useOfertaDeNiveles(tipo === "credito" ? perfil.persona.id : null);

  const valido = tipo === "debito" ? Boolean(cuentaId) : Boolean(nivel);
  const elegido = oferta.data?.niveles.find((n) => n.nivel === nivel) ?? null;

  return (
    <Panel
      title="Pedir una tarjeta"
      description="La de débito usa el saldo de tu cuenta; la de crédito tiene un límite propio, que define el nivel."
    >
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valido) return;
          emitir.mutate(
            {
              persona_id: perfil.persona.id,
              tipo,
              cuenta_id: tipo === "debito" ? cuentaId : null,
              nivel: tipo === "credito" ? nivel : null,
            },
            {
              onSuccess: (t) => {
                setNivel(null);
                onEmitida(t);
              },
            }
          );
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Tipo">
            <Select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as "debito" | "credito");
                setNivel(null);
                emitir.reset();
              }}
            >
              <option value="debito">Débito</option>
              <option value="credito">Crédito</option>
            </Select>
          </Campo>
          {tipo === "debito" && (
            <Campo label="Cuenta">
              <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
                {cuentasEnPesos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {etiquetaDeCuenta(c)}
                  </option>
                ))}
              </Select>
            </Campo>
          )}
        </div>

        {tipo === "credito" && (
          <div className="grid gap-3">
            {oferta.isLoading && <Vacio>Consultando tu situación crediticia…</Vacio>}
            {oferta.isError && <Aviso tipo="error">{mensajeDeError(oferta.error)}</Aviso>}
            {oferta.data && (
              <>
                <ResumenDeElegibilidad
                  situacion={oferta.data.situacion}
                  patrimonio={oferta.data.patrimonio}
                  nivelMaximo={oferta.data.nivel_maximo}
                  niveles={oferta.data.niveles}
                />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {oferta.data.niveles.map((n) => (
                    <FichaDeNivel key={n.nivel} nivel={n} elegido={nivel === n.nivel} onElegir={() => setNivel(n.nivel)} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {emitir.isError && <Aviso tipo="error">{mensajeDeError(emitir.error)}</Aviso>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {tipo === "credito" && elegido
              ? `Pedís la ${elegido.nombre}, con un límite de ${formatMontoRedondo(elegido.limite)}.`
              : tipo === "credito"
                ? "Elegí un nivel para continuar."
                : "La tarjeta de débito se emite al instante."}
          </p>
          <Boton type="submit" cargando={emitir.isPending} disabled={!valido}>
            Pedir tarjeta
          </Boton>
        </div>
      </form>
    </Panel>
  );
}

/** Por qué el banco ofrece estos niveles y no otros: sin misterio para el cliente. */
function ResumenDeElegibilidad({
  situacion,
  patrimonio,
  nivelMaximo,
  niveles,
}: {
  situacion: number | null;
  patrimonio: number;
  nivelMaximo: NivelTarjeta | null;
  niveles: NivelOfrecido[];
}) {
  if (!nivelMaximo) {
    // Sin ningún nivel disponible el motivo es el mismo para los cuatro.
    return <Aviso tipo="atencion">{niveles[0]?.motivo ?? "Por ahora no podés pedir una tarjeta de crédito."}</Aviso>;
  }

  const maximo = niveles.find((n) => n.nivel === nivelMaximo);
  return (
    <p className="text-xs text-muted-foreground">
      {situacion === null
        ? "No pudimos consultar tu situación en la Central de Deudores, así que por ahora te ofrecemos el nivel de entrada. "
        : `Tu situación en la Central de Deudores es ${situacion} y tu saldo total es ${formatMontoRedondo(patrimonio)}. `}
      Podés pedir hasta la <span className="text-foreground">{maximo?.nombre}</span>. Los dólares se valúan a la cotización de compra.
    </p>
  );
}

function FichaDeNivel({ nivel, elegido, onElegir }: { nivel: NivelOfrecido; elegido: boolean; onElegir: () => void }) {
  const estilo = ESTILO_NIVEL[nivel.nivel];
  return (
    <button
      type="button"
      onClick={onElegir}
      disabled={!nivel.disponible}
      aria-pressed={elegido}
      className={`grid gap-3 rounded-2xl border p-4 text-left transition ${
        elegido ? `${estilo.acento} bg-[#2D1548]/70 ring-2 ring-primary` : "border-primary/15 bg-[#1C0B2E]/60"
      } ${nivel.disponible ? "hover:border-primary/40" : "cursor-not-allowed opacity-60"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${estilo.chip}`}>{nivel.nombre}</span>
        {nivel.disponible ? (
          elegido && <Check className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </div>
      <div>
        <p className="text-lg">{formatMontoRedondo(nivel.limite)}</p>
        <p className="text-xs text-muted-foreground">Límite de compra</p>
      </div>
      <ul className="grid gap-1">
        {nivel.beneficios.map((b) => (
          <li key={b} className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary/70" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {nivel.motivo && <p className="text-xs text-amber-300/80">{nivel.motivo}</p>}
    </button>
  );
}
