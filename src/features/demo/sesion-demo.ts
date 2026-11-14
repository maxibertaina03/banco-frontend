/**
 * El token de una sesión de prueba, guardado en el navegador.
 *
 * Va en `sessionStorage` y no en `localStorage` a propósito: muere al cerrar la
 * pestaña, que es la semántica que pide la consigna ("al cerrar la sesión que
 * se borren esos cambios"). En localStorage, el visitante volvería dos días
 * después a una sesión que el servidor ya borró.
 */

const CLAVE = "orbital.demo.token";

/** Todo envuelto en try/catch: en una ventana privada el acceso puede tirar. */
export function leerToken(): string | null {
  try {
    return sessionStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

export function guardarToken(token: string) {
  try {
    sessionStorage.setItem(CLAVE, token);
  } catch {
    // Sin almacenamiento la sesión dura lo que dure la página. No es ideal,
    // pero es mejor que no dejar entrar.
  }
}

export function olvidarToken() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    /* nada que hacer */
  }
}

export function haySesionDemo(): boolean {
  return Boolean(leerToken());
}
