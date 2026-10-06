import { IsotipoOrbital } from "./IsotipoOrbital";

/**
 * La animación de carga del banco: el isotipo girando.
 *
 * Reusa el mismo SVG del logo en vez de dibujar otro anillo. El isotipo ya es
 * un aro claro con un arco violeta encima, así que alcanza con hacerlo girar:
 * el punto del medio está centrado y queda quieto a la vista. Antes cada
 * pantalla ponía su propio "Cargando…" en texto pelado.
 *
 *   pantalla   ocupa el alto de la ventana (sesión, rutas protegidas)
 *   panel      una tarjeta, para una sección que todavía no llegó
 *   enLinea    sin caja, para meter adentro de algo que ya la tiene
 *
 * `animate-spin` de Tailwind respeta `prefers-reduced-motion`: a quien pidió
 * menos movimiento en su sistema, el aro le queda quieto y le sigue quedando
 * el texto.
 */
export function CargandoOrbital({
  mensaje = "Cargando…",
  variante = "enLinea",
  size = 40,
}: {
  mensaje?: string;
  variante?: "pantalla" | "panel" | "enLinea";
  size?: number;
}) {
  const contenido = (
    // `role="status"` + `aria-live`: un lector de pantalla anuncia el cambio
    // en vez de dejar al usuario esperando en silencio.
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3">
      <IsotipoOrbital size={size} className="motion-safe:animate-spin" />
      {mensaje && <p className="text-sm text-purple-200">{mensaje}</p>}
    </div>
  );

  if (variante === "pantalla") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
        {contenido}
      </div>
    );
  }

  if (variante === "panel") {
    return (
      <div className="rounded-xl border border-primary/20 bg-[#1C0B2E] py-12">{contenido}</div>
    );
  }

  return <div className="py-8">{contenido}</div>;
}
