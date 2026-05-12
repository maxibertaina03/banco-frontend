export type Nullable<T> = T | null;

export type Role = {
  id: string;
  nombre: string;
  descripcion: Nullable<string>;
};

export type Persona = {
  id: string;
  nombre: Nullable<string>;
  apellido: Nullable<string>;
  dni: Nullable<string>;
  email: Nullable<string>;
  telefono: Nullable<string>;
  fecha_nacimiento: Nullable<string>;
  perfil_completo: boolean;
  created_at?: string;
};

export type Usuario = {
  id: string;
  persona_id: string;
  clerk_id: string;
  activo: boolean;
  created_at?: string;
};

export type Cuenta = {
  id: string;
  persona_id: string;
  tipo_cuenta_id: string;
  numero_cuenta: string;
  cbu: string;
  alias: Nullable<string>;
  saldo: string;
  activa: boolean;
  banco_central_registrada?: boolean;
  created_at?: string;
  tipo_cuenta_nombre?: string;
  tipo_cuenta_descripcion?: Nullable<string>;
};

export type Destinatario = {
  id: string;
  persona_id: string;
  alias: Nullable<string>;
  cbu_externo: string;
  banco_externo: Nullable<string>;
  created_at?: string;
};

export type TipoTransaccion = {
  id: string;
  nombre: string;
  descripcion: Nullable<string>;
};

export type Transaccion = {
  id: string;
  tipo_transaccion_id: string;
  cuenta_origen_id: Nullable<string>;
  cuenta_destino_id: Nullable<string>;
  monto: string;
  descripcion: Nullable<string>;
  estado: 'pendiente' | 'completada' | 'rechazada';
  canal?: 'local' | 'interbancaria_saliente' | 'interbancaria_entrante';
  central_transaction_id?: Nullable<string>;
  cbu_origen?: Nullable<string>;
  cbu_destino?: Nullable<string>;
  created_at: string;
  tipo_transaccion_nombre?: string;
  cuenta_origen_numero?: string;
  cuenta_destino_numero?: Nullable<string>;
};

export type AuthProfile = {
  id: string;
  persona_id: string;
  clerk_id: string;
  activo: boolean;
  usuario_created_at?: string;
  nombre: Nullable<string>;
  apellido: Nullable<string>;
  dni: Nullable<string>;
  email: Nullable<string>;
  telefono: Nullable<string>;
  fecha_nacimiento: Nullable<string>;
  perfil_completo: boolean;
  persona_created_at?: string;
  roles: Role[];
};

export type PersonaFullResponse = {
  persona: Persona;
  usuario: Nullable<Usuario>;
  cuentas: Cuenta[];
  destinatarios: Destinatario[];
  roles: RoleAssignment[];
};

export type RoleAssignment = Role & {
  persona_rol_id: string;
  asignado_at: string;
};

export type DashboardOverview = {
  profile: AuthProfile;
  persona: Persona;
  usuario: Nullable<Usuario>;
  cuentas: Cuenta[];
  destinatarios: Destinatario[];
  roles: RoleAssignment[];
  transacciones: Transaccion[];
  tiposTransaccion: TipoTransaccion[];
  isInternalUser: boolean;
  requiresOnboarding: boolean;
};

export type DashboardOverviewPayload = Omit<DashboardOverview, 'persona' | 'roles'> & {
  persona: Persona | null;
  roles: Array<Role | RoleAssignment>;
};

export type TransferPayload = {
  tipo_transaccion_id: string;
  cuenta_origen_id: string;
  cuenta_destino_id?: string | null;
  monto: number;
  descripcion?: string | null;
  estado?: 'pendiente' | 'completada' | 'rechazada';
};
