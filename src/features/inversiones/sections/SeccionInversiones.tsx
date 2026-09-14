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
import { useAcreditarPlazoFijo, useConstituirPlazoFijo, usePlazosFijos, useTasas } from "../../../lib/queries";
import { formatCurrency, formatFecha, formatPorcentaje } from "../../../lib/utils/currency";
import { simularPlazoFijo } from "../api/inversiones.api";
import type { PlazoFijo, SimulacionPlazoFijo } from "../types/inversiones.types";

const PLAZOS = [30, 60, 90, 180, 365];

const ESTADO: Record<PlazoFijo["estado"], { texto: string; clase: string }> = {
  vigente: { texto: "Vigente", clase: "bg-primary/15 text-primary" },
  vencido: { texto: "Listo para cobrar", clase: "bg-amber-400/15 text-amber-300" },
  acreditado: { texto: "Cobrado", clase: "bg-emerald-400/15 text-emerald-300" },
  cancelado_anticipado: { texto: "Rescatado", clase: "bg-[#2D1548] text-muted-foreground" },
};

function hoySimple() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function SeccionInversiones({ perfil }: { perfil: PersonaCompleta }) {
  return (
    <div className="grid gap-6">
      <Constituir perfil={perfil} />
      <MisPlazosFijos perfil={perfil} />
    </div>
  );
}

function Constituir({ perfil }: { perfil: PersonaCompleta }) {
  const cuentas = perfil.cuentas.filter((c) => c.activa);
  const tasas = useTasas();
  const [capitalTexto, setCapitalTexto] = useState("");
  const [dias, setDias] = useState(30);
  const [cuentaId, setCuentaId] = useState(cuentas[0]?.id ?? "");
  const [simulada, setSimulada] = useState<SimulacionPlazoFijo | null>(null);
  const [clave, renovarClave] = useClaveIdempotencia();
  const simular = useMutation({ mutationFn: simularPlazoFijo });
  const constituir = useConstituirPlazoFijo(perfil.persona.id);

  const capital = parsearMonto(capitalTexto);
  const cuenta = cuentas.find((c) => c.id === cuentaId);
  const moneda = cuenta?.moneda ?? "ARS";
  const vigente = simulada && simulada.capital === capital && simulada.dias === dias ? simulada : null;
  const sinSaldo = Boolean(cuenta && capital && capital > Number(cuenta.saldo));

  return (
    <Panel
      title="Plazo fijo"
      description={
        tasas.data?.plazo_fijo.tna
          ? `TNA de referencia hoy: ${formatPorcentaje(tasas.data.plazo_fijo.tna)}. Al vencimiento se acredita capital más intereses.`
          : "Al vencimiento se acredita capital más intereses."
      }
    >
      <form
        className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (!capital) return;
          constituir.reset();
          simular.mutate({ capital, dias }, { onSuccess: setSimulada });
        }}
      >
        <Campo label="Desde la cuenta">
          <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {etiquetaDeCuenta(c)}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo label={`Monto (${moneda})`} error={sinSaldo ? "No te alcanza el saldo." : null}>
          <Entrada inputMode="decimal" value={capitalTexto} onChange={(e) => setCapitalTexto(e.target.value)} placeholder="100.000" />
        </Campo>
        <Campo label="Plazo">
          <Select value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            {PLAZOS.map((d) => (
              <option key={d} value={d}>
                {d} días
              </option>
            ))}
          </Select>
        </Campo>
        <Boton type="submit" variante="secundario" cargando={simular.isPending} disabled={!capital}>
          Simular
        </Boton>
      </form>

      {simular.isError && <div className="mt-4"><Aviso tipo="error">{mensajeDeError(simular.error)}</Aviso></div>}

      {vigente && (
        <div className="mt-6 grid gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Dato label="Cobrás al vencimiento" valor={formatCurrency(vigente.total, moneda)} destacado />
            <Dato label="Intereses" valor={formatCurrency(vigente.interes, moneda)} />
            <Dato label="TNA" valor={formatPorcentaje(vigente.tna)} />
            <Dato label="TEA" valor={formatPorcentaje(vigente.tea)} />
          </div>
          {constituir.isError && <Aviso tipo="error">{mensajeDeError(constituir.error)}</Aviso>}
          {constituir.isSuccess ? (
            <Aviso tipo="exito">Plazo fijo constituido. Vence el {formatFecha(constituir.data.fecha_vencimiento)}.</Aviso>
          ) : (
            <Boton
              cargando={constituir.isPending}
              disabled={sinSaldo}
              onClick={() =>
                constituir.mutate(
                  { cuenta_id: cuentaId, capital: vigente.capital, dias: vigente.dias, idempotencyKey: clave },
                  {
                    onSuccess: () => {
                      renovarClave();
                      setCapitalTexto("");
                    },
                  }
                )
              }
            >
              Constituir plazo fijo
            </Boton>
          )}
        </div>
      )}
    </Panel>
  );
}

function MisPlazosFijos({ perfil }: { perfil: PersonaCompleta }) {
  const plazos = usePlazosFijos();
  const acreditar = useAcreditarPlazoFijo(perfil.persona.id);
  const [clave, renovarClave] = useClaveIdempotencia();
  const [confirmandoRescate, setConfirmandoRescate] = useState<string | null>(null);
  const hoy = hoySimple();

  function cobrar(pf: PlazoFijo, anticipada: boolean) {
    acreditar.mutate(
      { plazoFijoId: pf.id, anticipada, idempotencyKey: clave },
      {
        onSuccess: () => {
          renovarClave();
          setConfirmandoRescate(null);
        },
      }
    );
  }

  return (
    <Panel title="Mis plazos fijos">
      {plazos.isError && <Aviso tipo="error">{mensajeDeError(plazos.error)}</Aviso>}
      {plazos.isLoading && <Vacio>Cargando…</Vacio>}
      {plazos.data?.data.length === 0 && <Vacio>No tenés plazos fijos.</Vacio>}
      {acreditar.isError && <div className="mb-3"><Aviso tipo="error">{mensajeDeError(acreditar.error)}</Aviso></div>}
      {acreditar.isSuccess && (
        <div className="mb-3">
          <Aviso tipo="exito">
            {acreditar.data.anticipada ? "Rescataste" : "Cobraste"} {formatCurrency(acreditar.data.total_acreditado, acreditar.data.plazo_fijo.moneda)}.
          </Aviso>
        </div>
      )}

      <div className="grid gap-3">
        {plazos.data?.data.map((pf) => {
          // `fecha_vencimiento` es YYYY-MM-DD: la comparación de strings es correcta.
          const vencio = pf.fecha_vencimiento <= hoy;
          const abierto = pf.estado === "vigente" || pf.estado === "vencido";
          return (
            <div key={pf.id} className="grid gap-3 rounded-2xl border border-primary/15 bg-[#2D1548]/40 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{formatCurrency(pf.capital, pf.moneda)} a {pf.dias} días</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${ESTADO[pf.estado].clase}`}>{ESTADO[pf.estado].texto}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  TNA {formatPorcentaje(pf.tna)} · vence el {formatFecha(pf.fecha_vencimiento)} ·{" "}
                  {pf.total_acreditado !== null
                    ? `acreditado ${formatCurrency(pf.total_acreditado, pf.moneda)}`
                    : `cobrás ${formatCurrency(pf.total, pf.moneda)}`}
                </p>
              </div>

              {abierto && (
                <div className="flex flex-wrap gap-2">
                  {vencio ? (
                    <Boton cargando={acreditar.isPending} onClick={() => cobrar(pf, false)}>
                      Cobrar
                    </Boton>
                  ) : confirmandoRescate === pf.id ? (
                    <>
                      <Boton variante="peligro" cargando={acreditar.isPending} onClick={() => cobrar(pf, true)}>
                        Confirmar rescate
                      </Boton>
                      <Boton variante="secundario" onClick={() => setConfirmandoRescate(null)}>
                        No
                      </Boton>
                    </>
                  ) : (
                    <Boton variante="secundario" onClick={() => setConfirmandoRescate(pf.id)}>
                      Rescatar antes
                    </Boton>
                  )}
                </div>
              )}
              {confirmandoRescate === pf.id && (
                <p className="text-xs text-amber-300 md:col-span-2">
                  Si lo rescatás antes del vencimiento, cobrás sólo los intereses de los días corridos y a una tasa reducida.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
