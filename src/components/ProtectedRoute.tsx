import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { setAccessTokenProvider } from "../lib/api/client";

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
      <div className="min-h-screen bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-300">Cargando sesión...</p>
        </div>
      </div>
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
      <div className="min-h-screen bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] flex items-center justify-center">
        <p className="text-purple-300">Preparando conexión segura...</p>
      </div>
    );
  }

  return <>{children}</>;
}
