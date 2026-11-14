import { useAuth } from "@clerk/clerk-react";
import { useCallback } from "react";
import { leerToken } from "../features/demo/sesion-demo";

/**
 * Quién está usando el portal: un cliente de Clerk o un visitante de prueba.
 *
 * Existe para que `ProtectedRoute` y `usePortalData` no tengan que saber de los
 * dos mundos. Devuelve la misma forma que `useAuth()` de Clerk —`isLoaded`,
 * `isSignedIn`, `getToken`— así que los dos lugares que lo consumen cambian una
 * línea y nada más.
 *
 * El token demo no se lee con `useState`: se mira el `sessionStorage` en cada
 * render. Es barato y evita el estado duplicado que se desincroniza cuando la
 * sesión se cierra desde otro lado.
 */
export function useSesion() {
  const clerk = useAuth();
  const tokenDemo = leerToken();

  const getToken = useCallback(async () => {
    const actual = leerToken();
    if (actual) return actual;
    return clerk.getToken();
  }, [clerk]);

  if (tokenDemo) {
    return {
      isLoaded: true,
      isSignedIn: true,
      esDemo: true,
      getToken,
      signOut: clerk.signOut,
    };
  }

  return {
    isLoaded: clerk.isLoaded,
    isSignedIn: Boolean(clerk.isSignedIn),
    esDemo: false,
    getToken,
    signOut: clerk.signOut,
  };
}
