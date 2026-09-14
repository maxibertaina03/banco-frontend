import { ArrowRightLeft, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Aviso,
  Boton,
  Campo,
  Dato,
  Entrada,
  Panel,
  Vacio,
  mensajeDeError,
  parsearMonto,
  useClaveIdempotencia,
} from "../../../components/operaciones/ui";
import type { PersonaCompleta } from "../../../lib/api";
import { useCambioDeDivisa, useCotizacion } from "../../../lib/queries";
import { formatCurrency } from "../../../lib/utils/currency";
import type { ResultadoCambio } from "../api/cambio.api";

type Operacion = "compra" | "venta";

/**
 * Compra y venta de dólares entre las dos cajas del titular.
 *
 * Visto desde el cliente: en la compra paga pesos a precio de VENTA del banco;
 * en la venta recibe pesos a precio de COMPRA. El monto se escribe siempre en la
 * moneda que sale, que es lo que pide el contrato.
 */
export function SeccionCambio({ perfil, onIrACuentas }: { perfil: PersonaCompleta; onIrACuentas: () => void }) {
  const cajaPesos = perfil.cuentas.find((c) => (c.moneda ?? "ARS") === "ARS" && c.activa);
  const cajaDolares = perfil.cuentas.find((c) => c.moneda === "USD" && c.activa);

  const cotizacion = useCotizacion();
  const cambio = useCambioDeDivisa(perfil.persona.id);
  const [clave, renovarClave] = useClaveIdempotencia();

  const [operacion, setOperacion] = useState<Operacion>("compra");
  const [montoTexto, setMontoTexto] = useState("");
  const [resultado, setResultado] = useState<ResultadoCambio | null>(null);

  const monto = parsearMonto(montoTexto);
  const origen = operacion === "compra" ? cajaPesos : cajaDolares;
  const destino = operacion === "compra" ? cajaDolares : cajaPesos;
  const monedaOrigen = operacion === "compra" ? "ARS" : "USD";
  const monedaDestino = operacion === "compra" ? "USD" : "ARS";
  const precio = cotizacion.data ? (operacion === "compra" ? cotizacion.data.venta : cotizacion.data.compra) : null;

  // Estimación para mostrar antes de confirmar. El importe real lo calcula el
  // backend con decimales exactos y la cotización vigente en ese momento.
  const estimado = useMemo(() => {
    if (!monto || !precio) return null;
    const bruto = operacion === "compra" ? monto / precio : monto * precio;
    return Math.floor(bruto * 100) / 100;
  }, [monto, precio, operacion]);

  const saldoInsuficiente = Boolean(origen && monto && monto > Number(origen.saldo));
  const cotizacionDeRespaldo = Boolean(cotizacion.data?.desde_respaldo);

  if (!cajaDolares) {
    return (
      <Panel title="Comprar y vender dólares">
        <Vacio>
          Para operar con dólares necesitás una caja de ahorro en USD.{" "}
          <button type="button" onClick={onIrACuentas} className="text-primary underline">
            Abrila desde Cuentas
          </button>
          .
        </Vacio>
      </Panel>
    );
  }

  function confirmar() {
    if (!origen || !destino || !monto) return;
    setResultado(null);
    cambio.mutate(
      { operacion, cuenta_origen_id: origen.id, cuenta_destino_id: destino.id, monto, idempotencyKey: clave },
      {
        onSuccess: (r) => {
          setResultado(r);
          setMontoTexto("");
          renovarClave();
        },
      }
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Panel title="Comprar y vender dólares" description="Entre tu caja en pesos y tu caja en dólares, al instante.">
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#2D1548]/60 p-1">
          {(["compra", "venta"] as const).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => {
                setOperacion(op);
                setResultado(null);
                cambio.reset();
                renovarClave();
              }}
              className={`rounded-xl py-2 text-sm transition ${operacion === op ? "bg-primary text-primary-foreground" : "hover:bg-[#2D1548]"}`}
            >
              {op === "compra" ? "Comprar USD" : "Vender USD"}
            </button>
          ))}
        </div>

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            confirmar();
          }}
        >
          <Campo
            label={`Monto a ${operacion === "compra" ? "pagar" : "vender"} (${monedaOrigen})`}
            hint={origen ? `Disponible: ${formatCurrency(Number(origen.saldo), monedaOrigen)}` : undefined}
            error={saldoInsuficiente ? "No te alcanza el saldo." : montoTexto && !monto ? "Ingresá un monto válido." : null}
          >
            <Entrada inputMode="decimal" value={montoTexto} onChange={(e) => setMontoTexto(e.target.value)} placeholder="0,00" autoFocus />
          </Campo>

          <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-[#1C0B2E]/60 p-4">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Recibís aproximadamente</p>
              <p className="text-2xl">{estimado !== null ? formatCurrency(estimado, monedaDestino) : "—"}</p>
            </div>
          </div>

          {cotizacionDeRespaldo && (
            <Aviso tipo="atencion">La cotización no está actualizada. No se puede operar hasta que vuelva a estar disponible.</Aviso>
          )}
          {cambio.isError && <Aviso tipo="error">{mensajeDeError(cambio.error)}</Aviso>}
          {resultado && (
            <Aviso tipo="exito">
              {resultado.operacion === "compra" ? "Compraste" : "Vendiste"}{" "}
              {formatCurrency(resultado.operacion === "compra" ? resultado.monto_destino : resultado.monto_origen, "USD")} a{" "}
              {formatCurrency(resultado.cotizacion_aplicada)} por dólar.
            </Aviso>
          )}

          <Boton
            type="submit"
            cargando={cambio.isPending}
            disabled={!monto || saldoInsuficiente || !precio || cotizacionDeRespaldo}
          >
            Confirmar {operacion === "compra" ? "compra" : "venta"}
          </Boton>
        </form>
      </Panel>

      <Panel
        title="Cotización"
        description="Dólar oficial, fuente DolarAPI."
        actions={
          <button type="button" onClick={() => void cotizacion.refetch()} aria-label="Actualizar cotización" className="rounded-lg p-2 hover:bg-[#2D1548]">
            <RefreshCw className={`h-4 w-4 ${cotizacion.isFetching ? "animate-spin" : ""}`} />
          </button>
        }
      >
        {cotizacion.isError && <Aviso tipo="error">{mensajeDeError(cotizacion.error)}</Aviso>}
        {cotizacion.data && (
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Dato label="Comprás a" valor={formatCurrency(cotizacion.data.venta)} destacado={operacion === "compra"} />
              <Dato label="Vendés a" valor={formatCurrency(cotizacion.data.compra)} destacado={operacion === "venta"} />
            </div>
            <p className="text-xs text-muted-foreground">
              Actualizada{" "}
              {new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(cotizacion.data.fecha_actualizacion))}
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}
