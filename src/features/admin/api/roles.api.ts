// Asignar y quitar roles. Sólo el administrador: repartir roles es repartir
// permisos, y el backend lo exige además de esconderlo en la interfaz.

import { request } from "../../../lib/api/client";
import type { Rol } from "../../personas/types/personas.types";

/** La fila que une una persona con un rol. Se borra por su propio id. */
export interface AsignacionDeRol {
  id: string;
  persona_id: string;
  rol_id: string;
  asignado_at?: string;
}

interface Lista<T> {
  data: T[];
}

export async function listarRoles() {
  const r = await request<Lista<Rol>>("/roles?limit=50");
  return r.data;
}

export async function listarAsignaciones(personaId: string) {
  const r = await request<Lista<AsignacionDeRol>>(
    `/personas-roles?persona_id=${encodeURIComponent(personaId)}&limit=50`
  );
  return r.data;
}

export function asignarRol(personaId: string, rolId: string) {
  return request<AsignacionDeRol>("/personas-roles", {
    method: "POST",
    body: JSON.stringify({ persona_id: personaId, rol_id: rolId }),
  });
}

export function quitarRol(asignacionId: string) {
  return request<unknown>(`/personas-roles/${asignacionId}`, { method: "DELETE" });
}
