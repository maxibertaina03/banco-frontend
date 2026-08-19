import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  obtenerPerfilDeUsuarioAutenticado,
  obtenerPersonaCompleta,
  obtenerAuditoriaDeUsuario,
  listarPersonas,
  actualizarPerfilDeUsuarioAutenticado,
} from "../../features/personas/api/personas.api";
import { queryKeys } from "./keys";

// Perfil del usuario autenticado en Clerk + sus datos en BD.
// Es la query "raíz": casi todas las otras dependen de saber qué persona somos.
export function usePerfilAutenticado(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.auth.perfil,
    queryFn: () => obtenerPerfilDeUsuarioAutenticado(),
    enabled: options.enabled ?? true,
  });
}

// Datos completos de una persona: persona + usuario + cuentas + destinatarios + roles.
export function usePersonaFull(personaId: string | null | undefined) {
  return useQuery({
    queryKey: personaId ? queryKeys.personas.full(personaId) : ["personas", "full", "disabled"],
    queryFn: () => obtenerPersonaCompleta(personaId as string),
    enabled: Boolean(personaId),
  });
}

// Listado global de personas (solo roles internos pueden acceder).
// `enabled` debe controlarse externamente según el rol del usuario.
export function usePersonas(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.personas.list(),
    queryFn: () => listarPersonas(),
    enabled: options.enabled ?? true,
  });
}

// Mutation para edición parcial del perfil. Al completarse invalida auth
// perfil y persona full (para que se reflejen los cambios en toda la UI).
export function useActualizarPerfil(personaId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<{
      nombre: string;
      apellido: string;
      telefono: string;
      email: string;
    }>) => actualizarPerfilDeUsuarioAutenticado(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auth.perfil });
      if (personaId) {
        qc.invalidateQueries({ queryKey: queryKeys.personas.full(personaId) });
      }
    },
  });
}

// Auditoría de un usuario. Requiere usuarioId (no personaId).
export function useAuditoriaDeUsuario(usuarioId: string | null | undefined) {
  return useQuery({
    queryKey: usuarioId ? queryKeys.personas.audit(usuarioId) : ["personas", "audit", "disabled"],
    queryFn: () => obtenerAuditoriaDeUsuario(usuarioId as string),
    enabled: Boolean(usuarioId),
  });
}
