import { useQuery } from "@tanstack/react-query";
import { getAuthenticatedUserProfile, getPersonaFull, getUserAudit, listPersonas } from "../../features/personas/api/personas.api";
import { queryKeys } from "./keys";

// Perfil del usuario autenticado en Clerk + sus datos en BD.
// Es la query "raíz": casi todas las otras dependen de saber qué persona somos.
export function useAuthProfile(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: () => getAuthenticatedUserProfile(),
    enabled: options.enabled ?? true,
  });
}

// Datos completos de una persona: persona + usuario + cuentas + destinatarios + roles.
export function usePersonaFull(personaId: string | null | undefined) {
  return useQuery({
    queryKey: personaId ? queryKeys.personas.full(personaId) : ["personas", "full", "disabled"],
    queryFn: () => getPersonaFull(personaId as string),
    enabled: Boolean(personaId),
  });
}

// Listado global de personas (solo roles internos pueden acceder).
// `enabled` debe controlarse externamente según el rol del usuario.
export function usePersonas(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.personas.list(),
    queryFn: () => listPersonas(),
    enabled: options.enabled ?? true,
  });
}

// Auditoría de un usuario. Requiere usuarioId (no personaId).
export function useUserAudit(usuarioId: string | null | undefined) {
  return useQuery({
    queryKey: usuarioId ? queryKeys.personas.audit(usuarioId) : ["personas", "audit", "disabled"],
    queryFn: () => getUserAudit(usuarioId as string),
    enabled: Boolean(usuarioId),
  });
}
