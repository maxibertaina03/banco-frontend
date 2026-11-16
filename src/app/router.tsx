import type { ReactNode } from "react";
import { Navigate, Route, Routes, useSearchParams } from "react-router";
import { useAuth } from "@clerk/clerk-react";
import App from "./App";
import { PaginaIngreso } from "../features/auth/PaginaIngreso";
import { PaginaRegistro } from "../features/auth/PaginaRegistro";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { CobrarPage, EscanearPage, PagarPage } from "../features/qr/pages/QrPages";
import { EntradaDemo } from "../features/demo/EntradaDemo";
import { rutaInternaSegura } from "../features/auth/redirect-url";

function PaginaQrProtegida({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

/** Con la sesión ya iniciada, las pantallas de acceso no tienen sentido: al portal. */
function SoloSinSesion({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [searchParams] = useSearchParams();
  if (isLoaded && isSignedIn) {
    return <Navigate to={rutaInternaSegura(searchParams.get("redirect_url"))} replace />;
  }
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      {/* El `/*` es necesario: Clerk usa subrutas para los pasos intermedios,
          como /registro/verify-email-address. */}
      <Route path="/ingresar/*" element={<SoloSinSesion><PaginaIngreso /></SoloSinSesion>} />
      <Route path="/registro/*" element={<SoloSinSesion><PaginaRegistro /></SoloSinSesion>} />
      {/* Pública a propósito: es la que se abre al escanear el QR de prueba,
          y quien llega todavía no tiene sesión de ninguna clase. */}
      <Route path="/demo" element={<EntradaDemo />} />
      <Route path="/cobrar" element={<PaginaQrProtegida><CobrarPage /></PaginaQrProtegida>} />
      <Route path="/escanear" element={<PaginaQrProtegida><EscanearPage /></PaginaQrProtegida>} />
      <Route path="/pagar" element={<PaginaQrProtegida><PagarPage /></PaginaQrProtegida>} />
      <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
