export type Moneda = "ARS" | "USD";

export function formatCurrency(value: number, currency: string = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Saldo total separado por moneda.
 *
 * Sumar pesos con dólares da un número sin sentido, y con las cajas en USD eso
 * pasa en cuanto el cliente abre una. Cada moneda se totaliza por separado.
 */
export function totalesPorMoneda(cuentas: Array<{ saldo: number | string; moneda?: string | null; activa?: boolean }>) {
  const totales: Record<Moneda, number> = { ARS: 0, USD: 0 };
  for (const cuenta of cuentas) {
    const moneda = (cuenta.moneda === "USD" ? "USD" : "ARS") as Moneda;
    // Se redondea a centavos en cada paso para no arrastrar error de coma flotante.
    totales[moneda] = Math.round((totales[moneda] + Number(cuenta.saldo || 0)) * 100) / 100;
  }
  return totales;
}

export function formatPorcentaje(value: number | null | undefined, decimales = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: decimales }).format(value)} %`;
}

export function formatFecha(value: string | null | undefined) {
  if (!value) return "—";
  // Las fechas simples (YYYY-MM-DD) se parsean como locales: con `new Date(str)`
  // se interpretan en UTC y en Argentina muestran el día anterior.
  const simple = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const fecha = simple ? new Date(Number(simple[1]), Number(simple[2]) - 1, Number(simple[3])) : new Date(value);
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(fecha);
}
