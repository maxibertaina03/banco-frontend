import { CreditCard, Lock, Unlock } from "lucide-react";
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
  useResumenTarjeta,
  useTarjetas,
} from "../../../lib/queries";
import { formatCurrency, formatFecha } from "../../../lib/utils/currency";
import type { Autorizacion, Tarjeta } from "../types/tarjetas.types";

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
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={`relative aspect-[1.586] w-full max-w-full overflow-hidden rounded-3xl p-5 text-left text-white transition ${
        tarjeta.tipo === "credito" ? "bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#312E81]" : "bg-gradient-to-br from-[#4C1D95] via-[#6D28D9] to-[#A855F7]"
      } ${activa ? "ring-2 ring-primary ring-offset-2 ring-offset-[#1C0B2E]" : "opacity-90 hover:opacity-100"} ${inactiva ? "grayscale" : ""}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-sm text-white/80">Orbital {tarjeta.tipo === "credito" ? "Crédito" : "Débito"}</span>
        {inactiva ? (
          <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs capitalize">{tarjeta.estado}</span>
        ) : (
          <CreditCard className="h-5 w-5 text-white/70" />
        )}
      </div>
      <p className="mt-6 font-mono text-lg tracking-[0.2em] sm:text-xl">{tarjeta.numero_enmascarado}</p>
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
  const [limiteTexto, setLimiteTexto] = useState("");
  const emitir = useEmitirTarjeta(perfil.persona.id);
  const limite = parsearMonto(limiteTexto);
  const valido = tipo === "debito" ? Boolean(cuentaId) : Boolean(limite);

  return (
    <Panel title="Pedir una tarjeta" description="La de débito usa el saldo de tu cuenta; la de crédito tiene un límite propio.">
      <form
        className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valido) return;
          emitir.mutate(
            { persona_id: perfil.persona.id, tipo, cuenta_id: tipo === "debito" ? cuentaId : null, limite: tipo === "credito" ? limite : null },
            {
              onSuccess: (t) => {
                setLimiteTexto("");
                onEmitida(t);
              },
            }
          );
        }}
      >
        <Campo label="Tipo">
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as "debito" | "credito")}>
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
          </Select>
        </Campo>
        {tipo === "debito" ? (
          <Campo label="Cuenta">
            <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
              {cuentasEnPesos.map((c) => (
                <option key={c.id} value={c.id}>
                  {etiquetaDeCuenta(c)}
                </option>
              ))}
            </Select>
          </Campo>
        ) : (
          <Campo label="Límite solicitado (ARS)">
            <Entrada inputMode="decimal" value={limiteTexto} onChange={(e) => setLimiteTexto(e.target.value)} placeholder="500.000" />
          </Campo>
        )}
        <Boton type="submit" cargando={emitir.isPending} disabled={!valido}>
          Pedir tarjeta
        </Boton>
      </form>
      {emitir.isError && <div className="mt-3"><Aviso tipo="error">{mensajeDeError(emitir.error)}</Aviso></div>}
    </Panel>
  );
}
