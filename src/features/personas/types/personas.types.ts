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

export interface AdminCentralRegistrationResult {
  status: number;
  message: string;
  centralBankStatus: number;
  centralBankPerson: {
    cbu?: string;
    alias?: string | null;
    nombre?: string;
    apellido?: string;
    dni?: string;
    message?: string;
  };
  persona: PersonaOption;
  cuenta: AccountRecord;
}

export interface CentralBankRecord {
  bankCode: number;
  name: string;
}

export interface CentralBankRenameResult {
  centralBank?: {
    message?: string;
    name?: string;
  } | null;
  config?: {
    bank_name?: string | null;
    environment?: string;
  } | null;
  registry?: {
    nombre?: string | null;
    environment?: string;
  } | null;
}

export interface CentralPersonLookupResult {
  cbu?: string;
  alias?: string | null;
  nombre?: string;
  apellido?: string;
  dni?: string;
  bankCode?: number;
  bankName?: string;
}

export interface CentralBankTransactionParty {
  nombre?: string;
  apellido?: string;
  dni?: string;
  cbu?: string;
  alias?: string | null;
}

export interface CentralBankTransactionRecord {
  _id?: string;
  cbuOrigen: string;
  cbuDestino: string;
  importe: number;
  estado?: string;
  bankCodeOrigen?: number;
  bankCodeDestino?: number;
  createdAt?: string;
  personaOrigen?: CentralBankTransactionParty | null;
  personaDestino?: CentralBankTransactionParty | null;
}

export interface SyncAccountRecord {
  id: string;
  persona_id: string;
  numero_cuenta: string;
  cbu: string | null;
  alias?: string | null;
  saldo: string | number;
  activa: boolean;
  banco_central_registrada: boolean;
  nombre: string;
  apellido: string;
  dni: string;
  email?: string;
  tipo_cuenta_nombre: string;
  sync_ready: boolean;
  sync_issues: string[];
  suggested_alias?: string | null;
}

export interface CentralBankAccountSyncResult {
  account: {
    id: string;
    cbu?: string | null;
    alias?: string | null;
    numero_cuenta?: string | null;
    banco_central_registrada?: boolean;
  };
  persona?: {
    id: string;
    nombre?: string;
    apellido?: string;
    dni?: string;
    email?: string;
  } | null;
  centralBank?: {
    status?: number;
    cbu?: string | null;
    registration?: Record<string, unknown> | null;
    alias?: Record<string, unknown> | null;
  } | null;
  warnings?: string[];
}
