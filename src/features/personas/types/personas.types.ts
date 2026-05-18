import type { AccountRecord } from "../../cuentas/types/cuentas.types";
import type { RecipientRecord } from "../../destinatarios/types/destinatarios.types";

export type PortalRole = "cliente" | "admin" | "operador" | "auditor" | "tesoreria";

export interface PersonaOption {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  telefono?: string | null;
}

export interface RoleRecord {
  id: string;
  nombre: string;
  descripcion?: string | null;
}

export interface UserRecord {
  id: string;
  persona_id: string;
  clerk_id: string;
  activo: boolean;
  created_at?: string;
}

export interface AuthenticatedUserProfile extends UserRecord {
  nombre: string;
  apellido: string;
  dni?: string | null;
  email: string;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  perfil_completo: boolean;
  roles: RoleRecord[];
}

export interface AuditRecord {
  id: string;
  usuario_id: string;
  accion: string;
  entidad: string;
  entidad_id?: string | null;
  payload_antes?: Record<string, unknown> | null;
  payload_despues?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface PersonaFullResponse {
  persona: PersonaOption;
  usuario: UserRecord | null;
  cuentas: AccountRecord[];
  destinatarios: RecipientRecord[];
  roles: RoleRecord[];
}
