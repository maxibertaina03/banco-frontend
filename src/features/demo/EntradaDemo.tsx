import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { CargandoOrbital } from "../../components/marca/CargandoOrbital";
import { Button } from "../../components/ui/button";
import { setAccessTokenProvider } from "../../lib/api/client";
import { abrirSesionDemo } from "./demo.api";
import { guardarToken, leerToken } from "./sesion-demo";

/**
 * La puerta del modo prueba: lo que se abre al escanear el QR.
 *
 * Es una ruta pública, fuera de `ProtectedRoute`, porque quien llega acá
 * todavía no es nadie: ése es justamente el pedido de la cátedra, que leyendo
 * un QR ya quede como cliente del banco.
 *
 * No valida nada del QR porque el QR no lleva nada: es una URL a secas. Toda la
 * decisión la toma el servidor al crear la sesión.
 */
export function EntradaDemo() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  // En React 18 con StrictMode el efecto corre dos veces en desarrollo, y sin
  // esto se abrirían dos sesiones —dos personas, dos juegos de movimientos— de
  // las cuales una queda huérfana hasta que la barre la tarea de fondo.
  const yaPedida = useRef(false);

  useEffect(() => {
    if (yaPedida.current) return;
    yaPedida.current = true;

    // Si ya hay una sesión abierta en esta pestaña, se entra con ésa en vez de
    // abrir otra.
    const existente = leerToken();
    if (existente) {
      setAccessTokenProvider(() => Promise.resolve(existente));
      navigate("/", { replace: true });
      return;
    }

    abrirSesionDemo()
      .then((sesion) => {
        guardarToken(sesion.token);
        setAccessTokenProvider(() => Promise.resolve(sesion.token));
        navigate("/", { replace: true });
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "No se pudo abrir la cuenta de prueba.");
      });
  }, [navigate]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] px-5">
        <div className="max-w-sm text-center text-white">
          <h1 className="text-xl font-semibold">No pudimos abrir la cuenta de prueba</h1>
          <p className="mt-3 text-sm text-purple-200/80">{error}</p>
          <Button className="mt-6 rounded-full px-6" onClick={() => window.location.reload()}>
            Probar de nuevo
          </Button>
        </div>
      </main>
    );
  }

  return <CargandoOrbital variante="pantalla" size={56} mensaje="Preparando tu cuenta de prueba…" />;
}
