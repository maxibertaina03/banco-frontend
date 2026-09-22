// La "órbita secreta": tocar el isotipo que orbita en el login o el registro
// da una bonificación de bienvenida.
//
// En el login todavía no se sabe quién es la persona, así que ahí sólo se deja
// marcado en el navegador que la encontró. El portal, al entrar, la reclama.
// La marca no es la garantía de nada: el backend decide si corresponde y
// garantiza que sea una sola vez.

import confetti from "canvas-confetti";
import { request } from "../../lib/api/client";

const CLAVE = "orbital:orbita-secreta";

export interface ResultadoBienvenida {
  monto: number;
  moneda: "USD" | "ARS";
  cuenta_abierta: boolean;
  cuenta: { id: string; cbu: string; numero_cuenta: string };
  transaccion_id: string;
}

export function reclamarBienvenida() {
  return request<ResultadoBienvenida>("/bonificaciones/bienvenida", { method: "POST" });
}

// localStorage puede no estar (modo privado, almacenamiento bloqueado): en ese
// caso el easter egg se festeja igual, sólo que no queda recordado.
export function marcarPendiente() {
  try {
    localStorage.setItem(CLAVE, "pendiente");
  } catch {
    /* sin almacenamiento, no se recuerda */
  }
}

export function estaPendiente() {
  try {
    return localStorage.getItem(CLAVE) === "pendiente";
  } catch {
    return false;
  }
}

export function olvidarPendiente() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* nada que olvidar */
  }
}

/** Confetti con los colores de la marca. Se apaga si el sistema pide menos movimiento. */
export function festejar() {
  const colores = ["#A855F7", "#C4B5FD", "#7C3AED", "#E9D5FF", "#34D399"];
  const base = { colors: colores, disableForReducedMotion: true, ticks: 220 };
  void confetti({ ...base, particleCount: 90, spread: 70, origin: { y: 0.6 } });
  setTimeout(() => void confetti({ ...base, particleCount: 60, spread: 110, startVelocity: 35, origin: { x: 0.2, y: 0.7 } }), 180);
  setTimeout(() => void confetti({ ...base, particleCount: 60, spread: 110, startVelocity: 35, origin: { x: 0.8, y: 0.7 } }), 320);
}
