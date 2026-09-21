import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router";
import { useAuth } from "@clerk/clerk-react";
import App from "./App";
import { PaginaIngreso } from "../features/auth/PaginaIngreso";
import { PaginaRegistro } from "../features/auth/PaginaRegistro";

/** Con la sesión ya iniciada, las pantallas de acceso no tienen sentido: al portal. */
function SoloSinSesion({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (isLoaded && isSignedIn) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      {/* El `/*` es necesario: Clerk usa subrutas para los pasos intermedios,
          como /registro/verify-email-address. */}
      <Route path="/ingresar/*" element={<SoloSinSesion><PaginaIngreso /></SoloSinSesion>} />
      <Route path="/registro/*" element={<SoloSinSesion><PaginaRegistro /></SoloSinSesion>} />
      <Route path="/" element={<App />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
