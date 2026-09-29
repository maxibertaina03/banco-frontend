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

/**
 * Convierte lo que escribe el usuario a número, con la convención argentina:
 * el punto separa miles y la coma, decimales. "1.500" son mil quinientos, no
 * uno con cincuenta. Como mucha gente escribe "1500.50", un punto seguido de
 * uno o dos dígitos también se acepta como decimal.
 *
 * Devuelve `null` si no es un monto válido, incluido más de dos decimales: con
 * plata es mejor rechazar que redondear en silencio.
 */
export function parsearMonto(texto: string): number | null {
  const limpio = texto.trim().replace(/\s/g, "");
  if (!limpio) return null;

  let normalizado: string;
  if (limpio.includes(",")) {
    // 1.500,50 → coma decimal, puntos de miles (deben ir en grupos de a 3).
    if (!/^\d{1,3}(\.\d{3})*,\d{1,2}$|^\d+,\d{1,2}$/.test(limpio)) return null;
    normalizado = limpio.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) {
    // 1.500 o 1.000.000 → puntos de miles.
    normalizado = limpio.replace(/\./g, "");
  } else if (/^\d+(\.\d{1,2})?$/.test(limpio)) {
    // 1500 o 1500.50 → punto decimal.
    normalizado = limpio;
  } else {
    return null;
  }

  const valor = Number(normalizado);
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

/**
 * Número → texto para meter en un campo de monto, en la convención que espera
 * `parsearMonto`: puntos de miles y coma decimal. Los centavos sólo aparecen si
 * existen, así "todo el saldo" se ve como "404.000" y no como "404.000,00".
 *
 * Trunca a centavos en vez de redondear: si redondeara para arriba, usar el
 * saldo completo quedaría un centavo por encima de lo disponible.
 */
export function formatearMontoEditable(value: number): string {
  const centavos = Math.floor(Number(value || 0) * 100) / 100;
  const decimales = Number.isInteger(centavos) ? 0 : 2;
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: 2,
  }).format(centavos);
}

/**
 * Importe sin centavos, para cifras "redondas" como el límite de una tarjeta:
 * "$ 1.500.000" se lee mejor que "$ 1.500.000,00".
 */
export function formatMontoRedondo(value: number, currency: string = "ARS") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}
