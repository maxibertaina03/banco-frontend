import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../lib/api/client";
import { queryKeys } from "../../lib/queries/keys";
import { estaPendiente, festejar, olvidarPendiente, reclamarBienvenida } from "./orbita-secreta";
import type { EstadoOrbita } from "./DialogoOrbitaSecreta";

/**
 * Si la persona encontró la órbita secreta en el login, la reclama al entrar.
 *
 * `listo` tiene que esperar al perfil completo: sin DNI no se puede abrir la
 * caja en dólares en el Banco Central, y el backend rechaza el pedido.
 */
export function useOrbitaSecreta(listo: boolean) {
  const qc = useQueryClient();
  const [estado, setEstado] = useState<EstadoOrbita | null>(null);
  // StrictMode monta dos veces en desarrollo: sin esto se reclamaría dos veces.
  // El backend igual lo frenaría, pero mostraría "ya la cobraste" de más.
  const enCurso = useRef(false);

  useEffect(() => {
    if (!listo || enCurso.current || !estaPendiente()) return;
    enCurso.current = true;

    reclamarBienvenida()
      .then((resultado) => {
        olvidarPendiente();
        setEstado({ tipo: "acreditada", resultado });
        festejar();
        void qc.invalidateQueries({ queryKey: queryKeys.personas.all });
        void qc.invalidateQueries({ queryKey: queryKeys.transacciones.all });
        void qc.invalidateQueries({ queryKey: queryKeys.cuentas.all });
      })
      .catch((error: unknown) => {
        const status = error instanceof ApiError ? error.status : 0;
        if (status === 409) {
          olvidarPendiente();
          setEstado({ tipo: "ya-cobrada" });
        } else if (status === 403) {
          // Situación crediticia: reintentar no va a cambiar nada pronto.
          olvidarPendiente();
          setEstado({ tipo: "error", mensaje: error instanceof Error ? error.message : "No corresponde." });
        } else {
          // Central caído o sin conexión: queda pendiente, se reintenta al volver.
          enCurso.current = false;
        }
      });
  }, [listo, qc]);

  return { estado, cerrar: () => setEstado(null) };
}
