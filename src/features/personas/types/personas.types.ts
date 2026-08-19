import type { Cuenta } from "../../cuentas/types/cuentas.types";
import type { Destinatario } from "../../destinatarios/types/destinatarios.types";

export type RolDePortal = "cliente" | "admin" | "operador" | "auditor" | "tesoreria";

export interface OpcionDePersona {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  telefono?: string | null;
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion?: string | null;
}

export interface Usuario {
  id: string;
  persona_id: string;
  activo: boolean;
  created_at?: string;
}

export interface PerfilUsuarioAutenticado extends Usuario {
  nombre: string;
  apellido: string;
  dni?: string | null;
  email: string;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  perfil_completo: boolean;
  roles: Rol[];
}

export interface RegistroDeAuditoria {
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

export interface PersonaCompleta {
  persona: OpcionDePersona;
  usuario: Usuario | null;
  cuentas: Cuenta[];
  destinatarios: Destinatario[];
  roles: Rol[];
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
  persona: OpcionDePersona;
  cuenta: Cuenta;
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

export interface TransaccionDelCentral {
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

export interface CuentaParaSincronizar {
  id: string;
  persona_id: string;
  numero_cuenta: string;
  cbu: string | null;
  alias?: string | null;
  saldo: number;
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

export interface ResultadoSincronizacionCuenta {
  cuenta: {
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
