import { formatCurrency, formatFecha } from "../../../lib/utils/currency";
import type { Moneda } from "../../common.types";
import type { CuotaPrestamo } from "../types/prestamos.types";

const ESTILO_ESTADO: Record<NonNullable<CuotaPrestamo["estado"]>, string> = {
  pagada: "bg-emerald-400/15 text-emerald-300",
  pendiente: "bg-[#2D1548] text-muted-foreground",
  en_mora: "bg-destructive/15 text-destructive",
};

/** Cronograma de amortización, sistema francés. Tabla con scroll propio en mobile. */
export function TablaCronograma({ cronograma, moneda = "ARS" }: { cronograma: CuotaPrestamo[]; moneda?: Moneda }) {
  const conEstado = cronograma.some((c) => c.estado);
  return (
    <div className="max-h-96 overflow-auto rounded-2xl border border-primary/15">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="sticky top-0 bg-[#1C0B2E] text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">Vence</th>
            <th className="px-3 py-2 text-right">Cuota</th>
            <th className="px-3 py-2 text-right">Capital</th>
            <th className="px-3 py-2 text-right">Interés</th>
            <th className="px-3 py-2 text-right">Saldo</th>
            {conEstado && <th className="px-3 py-2 text-left">Estado</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-primary/10">
          {cronograma.map((c) => (
            <tr key={c.numero}>
              <td className="px-3 py-2">{c.numero}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatFecha(c.vencimiento)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(c.cuota, moneda)}</td>
              <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(c.capital, moneda)}</td>
              <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(c.interes, moneda)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(c.saldo, moneda)}</td>
              {conEstado && (
                <td className="px-3 py-2">
                  {c.estado && <span className={`rounded-full px-2 py-0.5 text-xs ${ESTILO_ESTADO[c.estado]}`}>{c.estado.replace("_", " ")}</span>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
