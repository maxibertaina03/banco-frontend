import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { setAccessTokenProvider } from "../../lib/api/client";
import { cerrarSesionDemo } from "./demo.api";
import { olvidarToken } from "./sesion-demo";

/**
 * El cartel que avisa que esto es una prueba.
 *
 * La consigna pide que el visitante conozca el sistema "sin ser aún un cliente
 * o socio del banco": tiene que quedar claro en todo momento que lo que ve no
 * es plata de verdad. Por eso está siempre visible y no se puede cerrar.
 *
 * El botón de salir no es decorativo: es el que dispara el borrado de todo lo
 * que el visitante hizo.
 */
export function CartelDemo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    setSaliendo(true);
    try {
      await cerrarSesionDemo();
    } catch {
      // Si el servidor no contesta, igual se sale: la tarea de fondo barre la
      // sesión cuando venza. Dejar al visitante encerrado sería peor.
    }
    olvidarToken();
    setAccessTokenProvider(null);
    queryClient.clear();
    navigate("/ingresar", { replace: true });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
      <p className="flex items-center gap-2 text-sm text-amber-200">
        <FlaskConical className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">Modo prueba.</span> Los datos son ficticios y no afectan
          dinero real. Todo lo que hagas se borra al salir.
        </span>
      </p>
      <button
        type="button"
        onClick={() => void salir()}
        disabled={saliendo}
        className="flex min-h-11 shrink-0 items-center rounded-full border border-amber-400/40 bg-amber-400/15 px-4 text-sm text-amber-100 transition hover:bg-amber-400/25 disabled:opacity-50 dedo:min-h-11 sm:min-h-0 sm:py-1.5"
      >
        {saliendo ? "Saliendo…" : "Salir y borrar mis datos"}
      </button>
    </div>
  );
}
