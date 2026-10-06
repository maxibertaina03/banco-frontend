import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { setAccessTokenProvider } from "../lib/api/client";
import { CargandoOrbital } from "./marca/CargandoOrbital";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const location = useLocation();
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setAccessTokenProvider(() => getToken());
      setTokenReady(true);
    } else {
      setAccessTokenProvider(null);
      setTokenReady(false);
    }
  }, [getToken, isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <CargandoOrbital variante="pantalla" size={56} mensaje="Cargando sesión…" />
    );
  }

  // Ruta propia en vez de renderizar el login acá: así el ingreso y el
  // registro tienen URL, y Clerk puede ir y volver entre los dos.
  if (!isSignedIn) {
    const destino = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/ingresar?redirect_url=${encodeURIComponent(destino)}`} replace />;
  }

  if (!tokenReady) {
    return (
      <CargandoOrbital variante="pantalla" size={56} mensaje="Preparando conexión segura…" />
    );
  }

  return <>{children}</>;
}
