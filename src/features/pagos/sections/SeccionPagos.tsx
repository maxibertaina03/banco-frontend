import { Droplets, Flame, Lightbulb, Phone, Receipt, Smartphone, Tv, Wifi } from "lucide-react";
import { useState, type ComponentType } from "react";
import {
  Aviso,
  Boton,
  Campo,
  Entrada,
  Panel,
  Select,
  Vacio,
  etiquetaDeCuenta,
  mensajeDeError,
  useClaveIdempotencia,
} from "../../../components/operaciones/ui";
import type { PersonaCompleta } from "../../../lib/api";
import { useDeudaDeServicio, useEmpresasDeServicios, useOperadoras, usePagarFactura, useRecargarCelular } from "../../../lib/queries";
import { formatCurrency, formatFecha } from "../../../lib/utils/currency";
import { USA_MOCK_DE_PAGOS } from "../api/pagos.api";
import type { Factura, Rubro } from "../types/pagos.types";
import type { Cuenta } from "../../cuentas/types/cuentas.types";

const ICONO_RUBRO: Record<Rubro, ComponentType<{ className?: string }>> = {
  luz: Lightbulb,
  gas: Flame,
  agua: Droplets,
  internet: Wifi,
  telefonia: Phone,
  cable: Tv,
  otros: Receipt,
};

export function SeccionPagos({ perfil }: { perfil: PersonaCompleta }) {
  // Servicios y recargas se pagan sólo en pesos: el backend rechaza cuentas USD.
  const cuentasEnPesos = perfil.cuentas.filter((c) => (c.moneda ?? "ARS") === "ARS" && c.activa);
  const [pestana, setPestana] = useState<"servicios" | "recargas">("servicios");

  return (
    <div className="grid gap-6">
      {USA_MOCK_DE_PAGOS && (
        <Aviso tipo="atencion">Modo demo: los pagos usan datos simulados y no mueven saldo (VITE_PAGOS_MOCK).</Aviso>
      )}
      <div className="grid w-full grid-cols-2 gap-2 rounded-2xl bg-[#1C0B2E] p-1 sm:w-fit">
        {(["servicios", "recargas"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPestana(p)}
            className={`rounded-xl px-5 py-2 text-sm transition ${pestana === p ? "bg-primary text-primary-foreground" : "hover:bg-[#2D1548]"}`}
          >
            {p === "servicios" ? "Pagar servicios" : "Recargar celular"}
          </button>
        ))}
      </div>
      {cuentasEnPesos.length === 0 ? (
        <Vacio>Necesitás una caja de ahorro en pesos activa para pagar.</Vacio>
      ) : pestana === "servicios" ? (
        <PagoDeServicios perfil={perfil} cuentas={cuentasEnPesos} />
      ) : (
        <Recarga perfil={perfil} cuentas={cuentasEnPesos} />
      )}
    </div>
  );
}

function PagoDeServicios({ perfil, cuentas }: { perfil: PersonaCompleta; cuentas: Cuenta[] }) {
  const empresas = useEmpresasDeServicios();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [numeroTexto, setNumeroTexto] = useState("");
  // Se consulta al confirmar, no mientras escribe: cada consulta pega al proveedor.
  const [numeroConsultado, setNumeroConsultado] = useState<string | null>(null);
  const empresa = empresas.data?.find((e) => e.id === empresaId);
  const deuda = useDeudaDeServicio(empresaId, numeroConsultado);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Panel title="¿Qué querés pagar?">
        {empresas.isError && <Aviso tipo="error">{mensajeDeError(empresas.error)}</Aviso>}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {empresas.data?.map((e) => {
            const Icono = ICONO_RUBRO[e.rubro] ?? Receipt;
            return (
              <button
                key={e.id}
                type="button"
                aria-pressed={empresaId === e.id}
                onClick={() => {
                  setEmpresaId(e.id);
                  setNumeroConsultado(null);
                }}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center text-sm transition ${
                  empresaId === e.id ? "border-primary/60 bg-primary/15" : "border-primary/15 bg-[#2D1548]/40 hover:bg-[#2D1548]/70"
                }`}
              >
                <Icono className="h-5 w-5 text-primary" />
                <span>{e.nombre}</span>
                <span className="text-xs capitalize text-muted-foreground">{e.rubro}</span>
              </button>
            );
          })}
        </div>

        {empresa && (
          <form
            className="mt-5 grid gap-3"
            onSubmit={(ev) => {
              ev.preventDefault();
              const numero = numeroTexto.trim();
              if (numero) setNumeroConsultado(numero);
            }}
          >
            <Campo label={`Número de cliente de ${empresa.nombre}`} hint={empresa.formato_numero_cliente}>
              <Entrada inputMode="numeric" value={numeroTexto} onChange={(e) => setNumeroTexto(e.target.value.replace(/\D/g, ""))} placeholder="123456789" />
            </Campo>
            <Boton type="submit" variante="secundario" cargando={deuda.isFetching} disabled={!numeroTexto.trim()}>
              Consultar deuda
            </Boton>
          </form>
        )}
      </Panel>

      <Panel title="Facturas">
        {!numeroConsultado && <Vacio>Elegí una empresa y consultá con tu número de cliente.</Vacio>}
        {deuda.isError && <Aviso tipo="error">{mensajeDeError(deuda.error)}</Aviso>}
        {deuda.data && deuda.data.facturas.length === 0 && (
          <Aviso tipo="exito">No tenés deuda con {deuda.data.empresa.nombre}. ¡Estás al día!</Aviso>
        )}
        {deuda.data && deuda.data.facturas.length > 0 && (
          <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              Total adeudado: <span className="text-foreground">{formatCurrency(deuda.data.total_adeudado)}</span>
            </p>
            {deuda.data.facturas.map((f) => (
              <FilaFactura key={f.id} factura={f} numeroCliente={deuda.data.numero_cliente} cuentas={cuentas} personaId={perfil.persona.id} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function FilaFactura({ factura, numeroCliente, cuentas, personaId }: { factura: Factura; numeroCliente: string; cuentas: Cuenta[]; personaId: string }) {
  const [cuentaId, setCuentaId] = useState(cuentas[0]?.id ?? "");
  const [clave, renovarClave] = useClaveIdempotencia();
  const pagar = usePagarFactura(personaId);
  const cuenta = cuentas.find((c) => c.id === cuentaId);
  const sinSaldo = Boolean(cuenta && factura.monto > Number(cuenta.saldo));

  if (pagar.isSuccess) {
    return (
      <Aviso tipo="exito">
        Pagaste {formatCurrency(pagar.data.factura.monto)} del período {pagar.data.factura.periodo}. Comprobante{" "}
        <span className="font-mono">{pagar.data.comprobante}</span>.
      </Aviso>
    );
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-primary/15 bg-[#2D1548]/40 p-4">
      {/* En el celular el monto siempre abajo: con `flex-wrap`, según el largo de
          la fecha, a veces quedaba al costado y a veces no. */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <div>
          <p className="font-medium">Período {factura.periodo}</p>
          <p className={`text-xs ${factura.estado === "vencida" ? "text-destructive" : "text-muted-foreground"}`}>
            {factura.estado === "vencida" ? "Vencida el" : "Vence el"} {formatFecha(factura.vencimiento)}
          </p>
        </div>
        <p className="text-xl">{formatCurrency(factura.monto)}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} aria-label="Cuenta para pagar">
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {etiquetaDeCuenta(c)}
            </option>
          ))}
        </Select>
        <Boton
          cargando={pagar.isPending}
          disabled={sinSaldo}
          onClick={() =>
            pagar.mutate(
              { cuenta_id: cuentaId, empresa_id: factura.empresa_id, numero_cliente: numeroCliente, factura_id: factura.id, idempotencyKey: clave },
              { onSuccess: renovarClave }
            )
          }
        >
          Pagar
        </Boton>
      </div>
      {sinSaldo && <p className="text-xs text-destructive">No te alcanza el saldo de esta cuenta.</p>}
      {pagar.isError && <Aviso tipo="error">{mensajeDeError(pagar.error)}</Aviso>}
    </div>
  );
}

function Recarga({ perfil, cuentas }: { perfil: PersonaCompleta; cuentas: Cuenta[] }) {
  const operadoras = useOperadoras();
  const [operadoraId, setOperadoraId] = useState("");
  const [numero, setNumero] = useState("");
  const [monto, setMonto] = useState<number | null>(null);
  const [cuentaId, setCuentaId] = useState(cuentas[0]?.id ?? "");
  const [clave, renovarClave] = useClaveIdempotencia();
  const recargar = useRecargarCelular(perfil.persona.id);

  const operadora = operadoras.data?.find((o) => o.id === operadoraId);
  const cuenta = cuentas.find((c) => c.id === cuentaId);
  const numeroValido = /^\d{10}$/.test(numero);
  const sinSaldo = Boolean(cuenta && monto && monto > Number(cuenta.saldo));

  return (
    <Panel title="Recargar celular" description="La carga se acredita al instante en la línea.">
      {operadoras.isError && <Aviso tipo="error">{mensajeDeError(operadoras.error)}</Aviso>}
      <form
        className="grid max-w-2xl gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!operadora || !numeroValido || !monto) return;
          recargar.mutate(
            { cuenta_id: cuentaId, operadora_id: operadora.id, numero, monto, idempotencyKey: clave },
            {
              onSuccess: () => {
                renovarClave();
                setNumero("");
                setMonto(null);
              },
            }
          );
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Compañía">
            <Select
              value={operadoraId}
              onChange={(e) => {
                setOperadoraId(e.target.value);
                setMonto(null);
                recargar.reset();
              }}
            >
              <option value="">Elegí una compañía</option>
              {operadoras.data?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo
            label="Número"
            hint="10 dígitos: código de área sin 0 y número sin 15."
            error={numero && !numeroValido ? "Tiene que tener 10 dígitos." : null}
          >
            <Entrada inputMode="tel" value={numero} maxLength={10} onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))} placeholder="3514123456" />
          </Campo>
        </div>

        {operadora && (
          <Campo label="Monto">
            <div className="flex flex-wrap gap-2">
              {operadora.montos_disponibles.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={monto === m}
                  onClick={() => setMonto(m)}
                  className={`rounded-xl border px-4 py-2 text-sm transition ${
                    monto === m ? "border-primary bg-primary text-primary-foreground" : "border-primary/20 bg-[#2D1548]/60 hover:bg-[#2D1548]"
                  }`}
                >
                  {formatCurrency(m).replace(",00", "")}
                </button>
              ))}
            </div>
          </Campo>
        )}

        <Campo label="Pagar con" error={sinSaldo ? "No te alcanza el saldo." : null}>
          <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {etiquetaDeCuenta(c)}
              </option>
            ))}
          </Select>
        </Campo>

        {recargar.isError && <Aviso tipo="error">{mensajeDeError(recargar.error)}</Aviso>}
        {recargar.isSuccess && (
          <Aviso tipo="exito">
            Recargaste {formatCurrency(recargar.data.recarga.monto)} a {recargar.data.recarga.operadora} {recargar.data.recarga.numero}.
          </Aviso>
        )}

        <Boton type="submit" cargando={recargar.isPending} disabled={!operadora || !numeroValido || !monto || sinSaldo}>
          <Smartphone className="h-4 w-4" /> Recargar
        </Boton>
      </form>
    </Panel>
  );
}
