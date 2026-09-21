// Piezas compartidas por las pantallas de operaciones (cambio, tarjetas,
// préstamos, inversiones, pagos). Mantienen el mismo lenguaje visual que el
// resto del portal sin repetir clases en cada sección.

import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useState, type ReactNode, type SelectHTMLAttributes, type InputHTMLAttributes } from "react";
import { ApiError, nuevaClaveIdempotencia } from "../../lib/api/client";
import { formatCurrency } from "../../lib/utils/currency";
import type { Cuenta } from "../../features/cuentas/types/cuentas.types";

export function Panel({ title, description, children, actions }: { title: string; description?: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Campo({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: string | null; children: ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const claseControl =
  "h-11 w-full rounded-xl border border-primary/20 bg-[#2D1548]/60 px-4 text-sm outline-none transition focus:border-primary/60 disabled:opacity-50";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${claseControl} ${props.className ?? ""}`} />;
}

export function Entrada(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${claseControl} ${props.className ?? ""}`} />;
}

export function Boton({
  children,
  cargando = false,
  variante = "primario",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { cargando?: boolean; variante?: "primario" | "secundario" | "peligro" }) {
  const estilos = {
    primario: "bg-primary text-primary-foreground hover:bg-primary/90",
    secundario: "border border-primary/30 bg-[#2D1548]/60 hover:bg-[#2D1548]",
    peligro: "border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20",
  }[variante];
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || cargando}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${estilos} ${props.className ?? ""}`}
    >
      {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Dato({ label, valor, destacado = false }: { label: string; valor: ReactNode; destacado?: boolean }) {
  return (
    <div className="rounded-2xl bg-[#2D1548]/60 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 ${destacado ? "text-xl text-primary" : "text-base"}`}>{valor}</p>
    </div>
  );
}

/**
 * Traduce el error de una operación a algo que el cliente entienda. El mensaje
 * del backend ya viene en español y es específico, así que se usa tal cual; el
 * status sólo agrega contexto cuando el mensaje no alcanza.
 */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Tu sesión expiró. Volvé a iniciar sesión.";
    if (error.status === 503) return error.message || "El servicio no está disponible en este momento. Intentá en unos minutos.";
    return error.message;
  }
  if (error instanceof TypeError) return "No se pudo conectar con el banco. Revisá tu conexión.";
  return "No se pudo completar la operación.";
}

export function Aviso({ tipo, children }: { tipo: "error" | "exito" | "atencion"; children: ReactNode }) {
  const estilos = {
    error: "border-destructive/40 bg-destructive/10 text-destructive",
    exito: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    atencion: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  }[tipo];
  const Icono = tipo === "exito" ? CheckCircle2 : AlertTriangle;
  return (
    <div className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${estilos}`} role={tipo === "error" ? "alert" : "status"}>
      <Icono className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Vacio({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-primary/20 p-6 text-center text-sm text-muted-foreground">{children}</p>;
}

/** "Caja de ahorro en pesos · 000116822777 · $ 1.000.000,00": moneda, número y saldo. */
export function etiquetaDeCuenta(cuenta: Cuenta) {
  const moneda = cuenta.moneda ?? "ARS";
  return `Caja de ahorro en ${moneda === "USD" ? "dólares" : "pesos"} · ${cuenta.numero_cuenta} · ${formatCurrency(Number(cuenta.saldo), moneda)}`;
}

/**
 * Clave de idempotencia para una operación. Se mantiene igual mientras el
 * usuario reintenta (un doble click o una red que se corta mandan la misma
 * clave, y el backend no ejecuta dos veces) y se renueva sólo tras un éxito.
 */
export function useClaveIdempotencia() {
  const [clave, setClave] = useState(nuevaClaveIdempotencia);
  const renovar = useCallback(() => setClave(nuevaClaveIdempotencia()), []);
  return [clave, renovar] as const;
}

export function periodoActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}

// Vive en lib/utils/currency: lo usan también los schemas, que no deberían
// depender de componentes de UI.
export { parsearMonto } from "../../lib/utils/currency";
