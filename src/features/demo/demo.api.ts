import { request } from "../../lib/api/client";

export interface SesionDemo {
  token: string;
  expira_at: string;
  aviso: string;
}

/**
 * Abre una sesión de prueba. Es el único endpoint de la API que no pide
 * credenciales: atiende justamente al que todavía no es nadie.
 */
export function abrirSesionDemo() {
  return request<SesionDemo>("/demo/sesiones", { method: "POST" });
}

/** Cierra la sesión y borra del servidor todo lo que el visitante hizo. */
export function cerrarSesionDemo() {
  return request<{ message: string }>("/demo/sesiones/actual", { method: "DELETE" });
}

/** Simula que otro banco le transfiere plata al visitante. */
export function simularTransferenciaRecibida(monto: number) {
  return request<{ id: string; monto: string }>("/demo/entrante", {
    method: "POST",
    body: JSON.stringify({ monto }),
  });
}
