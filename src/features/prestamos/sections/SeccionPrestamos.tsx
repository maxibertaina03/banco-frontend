import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { usePagarCuota, usePrecancelarPrestamo, usePrestamo, usePrestamos, useSolicitarPrestamo, useTasas } from "../../../lib/queries";
import { formatCurrency, formatFecha, formatPorcentaje } from "../../../lib/utils/currency";
import { simularPrestamo } from "../api/prestamos.api";
import { TablaCronograma } from "../components/TablaCronograma";
import type { Prestamo, SimulacionPrestamo } from "../types/prestamos.types";

const PLAZOS = [3, 6, 12, 18, 24, 36, 48, 60, 72];

const ESTADO_PRESTAMO: Record<Prestamo["estado"], { texto: string; clase: string }> = {
  vigente: { texto: "Vigente", clase: "bg-primary/15 text-primary" },
  cancelado: { texto: "Cancelado", clase: "bg-emerald-400/15 text-emerald-300" },
  en_mora: { texto: "En mora", clase: "bg-destructive/15 text-destructive" },
};

export function SeccionPrestamos({ perfil }: { perfil: PersonaCompleta }) {
  const prestamos = usePrestamos();
  const [detalleId, setDetalleId] = useState<string | null>(null);

  return (
    <div className="grid gap-6">
      <Simulador perfil={perfil} onOtorgado={(p) => setDetalleId(p.id)} />

      <Panel title="Mis préstamos">
        {prestamos.isError && <Aviso tipo="error">{mensajeDeError(prestamos.error)}</Aviso>}
        {prestamos.isLoading && <Vacio>Cargando préstamos…</Vacio>}
        {prestamos.data?.data.length === 0 && <Vacio>No tenés préstamos. Simulá uno arriba.</Vacio>}
        <div className="grid gap-3">
          {prestamos.data?.data.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setDetalleId(detalleId === p.id ? null : p.id)}
              aria-expanded={detalleId === p.id}
              className={`grid gap-2 rounded-2xl border p-4 text-left transition sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6 ${
                detalleId === p.id ? "border-primary/50 bg-[#2D1548]/80" : "border-primary/15 bg-[#2D1548]/40 hover:bg-[#2D1548]/60"
              }`}
            >
              <div>
                <p className="font-medium">{formatCurrency(p.capital, p.moneda)} en {p.cuotas} cuotas</p>
                <p className="text-xs text-muted-foreground">Otorgado el {formatFecha(p.fecha_otorgamiento)} · TNA {formatPorcentaje(p.tna)}</p>
              </div>
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">Deuda</p>
                <p>{formatCurrency(p.saldo_deuda, p.moneda)}</p>
              </div>
              <span className={`w-fit rounded-full px-3 py-1 text-xs ${ESTADO_PRESTAMO[p.estado].clase}`}>{ESTADO_PRESTAMO[p.estado].texto}</span>
            </button>
          ))}
        </div>
      </Panel>

      {detalleId && <DetallePrestamo prestamoId={detalleId} perfil={perfil} />}
    </div>
  );
}

function Simulador({ perfil, onOtorgado }: { perfil: PersonaCompleta; onOtorgado: (p: Prestamo) => void }) {
  const cuentas = perfil.cuentas.filter((c) => c.activa);
  const tasas = useTasas();
  const [capitalTexto, setCapitalTexto] = useState("");
  const [cuotas, setCuotas] = useState(12);
  const [cuentaId, setCuentaId] = useState(cuentas.find((c) => (c.moneda ?? "ARS") === "ARS")?.id ?? cuentas[0]?.id ?? "");
  const [clave, renovarClave] = useClaveIdempotencia();
  const capital = parsearMonto(capitalTexto);
  const cuenta = cuentas.find((c) => c.id === cuentaId);
  const moneda = cuenta?.moneda ?? "ARS";

  // La simulación no se cachea como query: depende de lo que el usuario acaba
  // de escribir y se pide explícitamente con el botón.
  const simulacion = useMutation({ mutationFn: simularPrestamo });
  const solicitar = useSolicitarPrestamo(perfil.persona.id);
  const [simulada, setSimulada] = useState<SimulacionPrestamo | null>(null);

  // Si cambia algún dato después de simular, la simulación ya no vale.
  const vigente = simulada && simulada.capital === capital && simulada.cuotas === cuotas ? simulada : null;

  return (
    <Panel
      title="Simulá tu préstamo"
      description={
        tasas.data?.prestamos.tna
          ? `Tasa de referencia hoy: TNA ${formatPorcentaje(tasas.data.prestamos.tna)}. Sistema francés, cuota fija.`
          : "Sistema francés, cuota fija."
      }
    >
      <form
        className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (!capital) return;
          solicitar.reset();
          simulacion.mutate({ capital, cuotas }, { onSuccess: setSimulada });
        }}
      >
        <Campo label={`Monto (${moneda})`}>
          <Entrada inputMode="decimal" value={capitalTexto} onChange={(e) => setCapitalTexto(e.target.value)} placeholder="1.000.000" />
        </Campo>
        <Campo label="Cuotas">
          <Select value={cuotas} onChange={(e) => setCuotas(Number(e.target.value))}>
            {PLAZOS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo label="Acreditar en">
          <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {etiquetaDeCuenta(c)}
              </option>
            ))}
          </Select>
        </Campo>
        <Boton type="submit" variante="secundario" cargando={simulacion.isPending} disabled={!capital}>
          Simular
        </Boton>
      </form>

      {simulacion.isError && <div className="mt-4"><Aviso tipo="error">{mensajeDeError(simulacion.error)}</Aviso></div>}

      {vigente && (
        <div className="mt-6 grid gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Dato label="Cuota mensual" valor={formatCurrency(vigente.cuota_mensual, moneda)} destacado />
            <Dato label="Total a pagar" valor={formatCurrency(vigente.total_a_pagar, moneda)} />
            <Dato label="TNA / TEM" valor={`${formatPorcentaje(vigente.tna)} / ${formatPorcentaje(vigente.tem)}`} />
            <Dato label="CFT" valor={formatPorcentaje(vigente.cft)} />
          </div>
          <TablaCronograma cronograma={vigente.cronograma} moneda={moneda} />

          {solicitar.isError && <Aviso tipo="error">{mensajeDeError(solicitar.error)}</Aviso>}
          {solicitar.isSuccess ? (
            <Aviso tipo="exito">
              Préstamo otorgado. Acreditamos {formatCurrency(solicitar.data.capital, solicitar.data.moneda)} en tu cuenta.
            </Aviso>
          ) : (
            <Boton
              cargando={solicitar.isPending}
              disabled={!cuentaId}
              onClick={() =>
                solicitar.mutate(
                  { cuenta_id: cuentaId, capital: vigente.capital, cuotas: vigente.cuotas, idempotencyKey: clave },
                  {
                    onSuccess: (p) => {
                      renovarClave();
                      setCapitalTexto("");
                      onOtorgado(p);
                    },
                  }
                )
              }
            >
              Solicitar préstamo de {formatCurrency(vigente.capital, moneda)}
            </Boton>
          )}
        </div>
      )}
    </Panel>
  );
}

function DetallePrestamo({ prestamoId, perfil }: { prestamoId: string; perfil: PersonaCompleta }) {
  const prestamo = usePrestamo(prestamoId);
  const pagar = usePagarCuota(perfil.persona.id);
  const precancelar = usePrecancelarPrestamo(perfil.persona.id);
  const [clavePago, renovarPago] = useClaveIdempotencia();
  const [clavePrecancelacion, renovarPrecancelacion] = useClaveIdempotencia();
  const [confirmandoPrecancelacion, setConfirmandoPrecancelacion] = useState(false);

  const p = prestamo.data;
  const proxima = p?.cronograma?.find((c) => c.estado !== "pagada");
  const pagadas = p?.cronograma?.filter((c) => c.estado === "pagada").length ?? 0;
  const cerrado = p?.estado === "cancelado";

  return (
    <Panel title="Detalle del préstamo">
      {prestamo.isError && <Aviso tipo="error">{mensajeDeError(prestamo.error)}</Aviso>}
      {prestamo.isLoading && <Vacio>Cargando…</Vacio>}
      {p && (
        <div className="grid gap-5">
          {p.estado === "en_mora" && (
            <Aviso tipo="error">Tenés cuotas vencidas. Pagalas cuanto antes: la mora se informa a la Central de Deudores del BCRA.</Aviso>
          )}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Dato label="Deuda" valor={formatCurrency(p.saldo_deuda, p.moneda)} destacado />
            <Dato label="Cuotas pagas" valor={`${pagadas} de ${p.cuotas}`} />
            <Dato label="Cuota mensual" valor={formatCurrency(p.cuota_mensual, p.moneda)} />
            <Dato label="CFT" valor={formatPorcentaje(p.cft)} />
          </div>

          {!cerrado && (
            <div className="flex flex-wrap gap-3">
              <Boton
                cargando={pagar.isPending}
                disabled={!proxima}
                onClick={() => pagar.mutate({ prestamoId, idempotencyKey: clavePago }, { onSuccess: renovarPago })}
              >
                {proxima ? `Pagar cuota ${proxima.numero} · ${formatCurrency(proxima.cuota, p.moneda)}` : "Sin cuotas pendientes"}
              </Boton>
              {confirmandoPrecancelacion ? (
                <>
                  <Boton
                    variante="peligro"
                    cargando={precancelar.isPending}
                    onClick={() =>
                      precancelar.mutate(
                        { prestamoId, idempotencyKey: clavePrecancelacion },
                        {
                          onSuccess: () => {
                            renovarPrecancelacion();
                            setConfirmandoPrecancelacion(false);
                          },
                        }
                      )
                    }
                  >
                    Confirmar: debitar {formatCurrency(p.saldo_deuda, p.moneda)}
                  </Boton>
                  <Boton variante="secundario" onClick={() => setConfirmandoPrecancelacion(false)}>
                    Cancelar
                  </Boton>
                </>
              ) : (
                <Boton variante="secundario" onClick={() => setConfirmandoPrecancelacion(true)}>
                  Precancelar
                </Boton>
              )}
            </div>
          )}

          {pagar.isError && <Aviso tipo="error">{mensajeDeError(pagar.error)}</Aviso>}
          {pagar.isSuccess && (
            <Aviso tipo="exito">
              Pagaste la cuota {pagar.data.cuota.numero}.{" "}
              {pagar.data.cuotas_pendientes === 0 ? "¡Terminaste de pagar el préstamo!" : `Quedan ${pagar.data.cuotas_pendientes}.`}
            </Aviso>
          )}
          {precancelar.isError && <Aviso tipo="error">{mensajeDeError(precancelar.error)}</Aviso>}
          {precancelar.isSuccess && (
            <Aviso tipo="exito">Préstamo precancelado. Se debitaron {formatCurrency(precancelar.data.capital_pagado, p.moneda)}.</Aviso>
          )}

          {p.cronograma && <TablaCronograma cronograma={p.cronograma} moneda={p.moneda} />}
        </div>
      )}
    </Panel>
  );
}
