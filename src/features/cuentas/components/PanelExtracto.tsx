import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Aviso, Boton, Campo, Entrada, Panel, Select, Vacio, mensajeDeError, periodoActual } from "../../../components/operaciones/ui";
import { useMovimientos, useResumenDeGastos } from "../../../lib/queries";
import { formatCurrency } from "../../../lib/utils/currency";
import { exportarMovimientos } from "../api/cuentas.api";
import type { Cuenta } from "../types/cuentas.types";
import { etiquetaDeCanal } from "../../transacciones/canales";

const POR_PAGINA = 10;

export function PanelExtracto({ cuentas }: { cuentas: Cuenta[] }) {
  const [cuentaId, setCuentaId] = useState(cuentas[0]?.id ?? "");
  const [pagina, setPagina] = useState(1);
  const [periodo, setPeriodo] = useState(periodoActual);
  const cuenta = cuentas.find((c) => c.id === cuentaId);
  const moneda = cuenta?.moneda ?? "ARS";

  const movimientos = useMovimientos(cuentaId, pagina, POR_PAGINA);
  const resumen = useResumenDeGastos(cuentaId, periodo);

  // `count` es lo que vino en esta página: si llegó completa, puede haber otra.
  const hayMas = (movimientos.data?.count ?? 0) === POR_PAGINA;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <Panel
        title="Movimientos"
        description="El extracto de la cuenta, del más reciente al más antiguo."
        actions={
          <div className="w-full sm:w-72">
            <Select
              value={cuentaId}
              onChange={(e) => {
                setCuentaId(e.target.value);
                setPagina(1);
              }}
              aria-label="Cuenta"
            >
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.moneda === "USD" ? "USD" : "$"} · {c.numero_cuenta}
                </option>
              ))}
            </Select>
          </div>
        }
      >
        {movimientos.isError && <Aviso tipo="error">{mensajeDeError(movimientos.error)}</Aviso>}
        {movimientos.isLoading && <Vacio>Cargando movimientos…</Vacio>}
        {movimientos.data && movimientos.data.data.length === 0 && pagina === 1 && (
          <Vacio>Esta cuenta todavía no tiene movimientos.</Vacio>
        )}

        <ul className="divide-y divide-primary/10">
          {movimientos.data?.data.map((mov) => {
            const entra = mov.cuenta_destino_id === cuentaId;
            const fecha = new Date(mov.created_at);
            return (
              <li key={mov.id} className="flex items-center gap-3 py-3">
                <div className={`rounded-xl p-2 ${entra ? "bg-emerald-400/15 text-emerald-300" : "bg-[#2D1548] text-[#C084FC]"}`}>
                  {entra ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{mov.descripcion || etiquetaDeCanal(mov.canal, mov.tipo_transaccion_nombre)}</p>
                  <p className="text-xs text-muted-foreground">
                    {etiquetaDeCanal(mov.canal)} ·{" "}
                    {new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(fecha)}
                    {mov.estado !== "completada" && <span className="ml-1 text-amber-300">· {mov.estado}</span>}
                  </p>
                </div>
                <p className={`whitespace-nowrap text-sm font-medium ${entra ? "text-emerald-300" : ""}`}>
                  {entra ? "+" : "−"}
                  {formatCurrency(Math.abs(Number(mov.monto)), moneda)}
                </p>
              </li>
            );
          })}
        </ul>

        {(pagina > 1 || hayMas) && (
          <div className="mt-4 flex items-center justify-between">
            <Boton variante="secundario" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Boton>
            <span className="text-xs text-muted-foreground">Página {pagina}</span>
            <Boton variante="secundario" disabled={!hayMas || movimientos.isPlaceholderData} onClick={() => setPagina((p) => p + 1)}>
              Siguiente <ChevronRight className="h-4 w-4" />
            </Boton>
          </div>
        )}
      </Panel>

      <div className="grid content-start gap-6">
        <Panel
          title="Gastos del mes"
          actions={<Entrada type="month" value={periodo} onChange={(e) => e.target.value && setPeriodo(e.target.value)} className="w-40" aria-label="Período" />}
        >
          {resumen.isError && <Aviso tipo="error">{mensajeDeError(resumen.error)}</Aviso>}
          {resumen.data && <ResumenPorCategoria resumen={resumen.data} moneda={moneda} />}
        </Panel>

        {cuentaId && <PanelExportar cuentaId={cuentaId} />}
      </div>
    </div>
  );
}

function ResumenPorCategoria({
  resumen,
  moneda,
}: {
  resumen: NonNullable<ReturnType<typeof useResumenDeGastos>["data"]>;
  moneda: string;
}) {
  const gastos = useMemo(() => resumen.categorias.filter((c) => c.tipo === "gasto").sort((a, b) => b.total - a.total), [resumen]);
  const mayor = gastos[0]?.total || 1;

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-[#2D1548]/60 p-3">
          <p className="text-xs text-muted-foreground">Ingresos</p>
          <p className="text-sm text-emerald-300">{formatCurrency(resumen.total_ingresos, moneda)}</p>
        </div>
        <div className="rounded-2xl bg-[#2D1548]/60 p-3">
          <p className="text-xs text-muted-foreground">Gastos</p>
          <p className="text-sm">{formatCurrency(resumen.total_gastos, moneda)}</p>
        </div>
        <div className="rounded-2xl bg-[#2D1548]/60 p-3">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className={`text-sm ${resumen.balance < 0 ? "text-destructive" : "text-primary"}`}>{formatCurrency(resumen.balance, moneda)}</p>
        </div>
      </div>

      {gastos.length === 0 ? (
        <Vacio>No hubo gastos en este período.</Vacio>
      ) : (
        <ul className="grid gap-3">
          {gastos.map((c) => (
            <li key={c.categoria}>
              <div className="mb-1 flex justify-between text-sm">
                <span>
                  {c.categoria} <span className="text-xs text-muted-foreground">({c.cantidad})</span>
                </span>
                <span>{formatCurrency(c.total, moneda)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#2D1548]">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (c.total / mayor) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PanelExportar({ cuentaId }: { cuentaId: string }) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function descargar() {
    setDescargando(true);
    setError(null);
    try {
      const { blob, nombre } = await exportarMovimientos(cuentaId, { desde: desde || undefined, hasta: hasta || undefined });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombre ?? "movimientos.csv";
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setDescargando(false);
    }
  }

  return (
    <Panel title="Exportar" description="Descargá los movimientos en CSV para abrirlos en una planilla.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Desde">
          <Entrada type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} />
        </Campo>
        <Campo label="Hasta">
          <Entrada type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} />
        </Campo>
      </div>
      <Boton className="mt-4 w-full" variante="secundario" cargando={descargando} onClick={() => void descargar()}>
        <Download className="h-4 w-4" /> Descargar CSV
      </Boton>
      {error && <div className="mt-3"><Aviso tipo="error">{error}</Aviso></div>}
    </Panel>
  );
}
