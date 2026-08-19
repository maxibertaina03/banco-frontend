import { request, requestAbsolute } from "../../../lib/api/client";
import type {
  RegistroDeAuditoria,
  AdminCentralRegistrationResult,
  CentralBankRecord,
  ResultadoSincronizacionCuenta,
  CentralBankRenameResult,
  TransaccionDelCentral,
  CentralPersonLookupResult,
  PerfilUsuarioAutenticado,
  PersonaCompleta,
  OpcionDePersona,
  RolDePortal,
  Rol,
  CuentaParaSincronizar,
  Usuario,
} from "../types/personas.types";

export type {
  RegistroDeAuditoria,
  AdminCentralRegistrationResult,
  CentralBankRecord,
  ResultadoSincronizacionCuenta,
  CentralBankRenameResult,
  TransaccionDelCentral,
  CentralPersonLookupResult,
  PerfilUsuarioAutenticado,
  PersonaCompleta,
  OpcionDePersona,
  RolDePortal,
  Rol,
  CuentaParaSincronizar,
  Usuario,
} from "../types/personas.types";

interface ListResponse<T> {
  data: T[];
}

export function sanearIdDePersona(value?: string | null) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  if (normalized.includes("/") || normalized.toLowerCase().includes("api")) {
    return "";
  }

  return normalized;
}

function normalizeRole(roleName: string): RolDePortal | null {
  if (roleName === "cliente") {
    return "cliente";
  }

  if (roleName === "admin") {
    return "admin";
  }

  if (roleName === "operador") {
    return "operador";
  }

  if (roleName === "auditor") {
    return "auditor";
  }

  if (roleName === "tesoreria") {
    return "tesoreria";
  }

  return null;
}

export function obtenerAlcanceDeRol(role: RolDePortal) {
  return role === "cliente" ? "user" : "admin";
}

export function obtenerOpcionesDeRol(full: PersonaCompleta): RolDePortal[] {
  const roles = full.roles
    .map((role) => normalizeRole(role.nombre.toLowerCase()))
    .filter((role): role is RolDePortal => Boolean(role));

  if (roles.length > 0) {
    return Array.from(new Set(roles));
  }

  return ["cliente"];
}

export async function listarPersonas() {
  const response = await request<ListResponse<OpcionDePersona>>("/personas?limit=100");
  return response.data;
}

export async function listarRoles() {
  const response = await request<ListResponse<Rol>>("/roles?limit=50");
  return response.data;
}

export function obtenerPerfilDeUsuarioAutenticado() {
  return requestAbsolute<{ message: string; user: PerfilUsuarioAutenticado }>("/auth/perfil");
}

export function loguearUsuarioAutenticado() {
  return requestAbsolute<{ message: string; user: PerfilUsuarioAutenticado }>("/auth/login", {
    method: "POST",
  });
}

export function completarPerfilDeUsuarioAutenticado(payload: {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
}) {
  return requestAbsolute<{
    message: string;
    user: PerfilUsuarioAutenticado;
    centralBank: { status: number; message: string; cbu: string | null; alias: string | null } | null;
  }>("/auth/perfil", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// Edición parcial del perfil ya completo. Envia solo los campos que el
// usuario quiere cambiar (al menos uno).
export function actualizarPerfilDeUsuarioAutenticado(payload: Partial<{
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
}>) {
  return requestAbsolute<{
    message: string;
    user: PerfilUsuarioAutenticado;
  }>("/auth/perfil", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function listarCuentasParaSincronizar(options?: { environment?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (options?.environment) params.set("environment", options.environment);
  if (options?.limit) params.set("limit", String(options.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<{ cuentas: CuentaParaSincronizar[] }>(`/central-bank/sync/accounts${query}`);
}

export function obtenerPersonaCompleta(personaId: string) {
  return request<PersonaCompleta>(`/personas/${personaId}/full`);
}

export function obtenerAuditoriaDeUsuario(usuarioId: string) {
  return request<RegistroDeAuditoria[]>(`/usuarios/${usuarioId}/auditoria`);
}

export function crearPersona(payload: {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
}) {
  return request<OpcionDePersona>("/personas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function actualizarPersona(
  personaId: string,
  payload: Partial<{
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
    fecha_nacimiento: string | null;
  }>
) {
  return request<OpcionDePersona>(`/personas/${personaId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function crearUsuario(payload: {
  persona_id: string;
  clerk_id: string;
  activo?: boolean;
}) {
  return request<Usuario>("/usuarios", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function actualizarUsuario(
  usuarioId: string,
  payload: Partial<{
    clerk_id: string;
    activo: boolean;
  }>
) {
  return request<Usuario>(`/usuarios/${usuarioId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function asignarRolDePersona(payload: { persona_id: string; rol_id: string }) {
  return request("/personas-roles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registrarPersonaDesdeAdmin(payload: {
  nombre: string;
  apellido: string;
  dni: string;
  email?: string;
  telefono?: string;
  environment?: "test" | "prod";
}) {
  return request<AdminCentralRegistrationResult>("/central-bank/persons/local-register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listCentralBanks(environment: "test" | "prod" = "test") {
  return request<CentralBankRecord[]>(`/central-bank/banks?environment=${environment}`);
}

export function getCentralBankByCode(bankCode: number | string, environment: "test" | "prod" = "test") {
  return request<CentralBankRecord>(`/central-bank/banks/${bankCode}?environment=${environment}`);
}

export function updateCentralBankName(payload: {
  name: string;
  environment?: "test" | "prod";
}) {
  return request<CentralBankRenameResult>("/central-bank/banks/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function findCentralPersonByCbu(cbu: string, environment: "test" | "prod" = "test") {
  return request<CentralPersonLookupResult>(`/central-bank/persons/${encodeURIComponent(cbu)}?environment=${environment}`);
}

export function findCentralPersonByAlias(alias: string, environment: "test" | "prod" = "test") {
  return request<CentralPersonLookupResult>(`/central-bank/persons/alias/${encodeURIComponent(alias)}?environment=${environment}`);
}

export function listCentralBankTransactions(
  environment: "test" | "prod" = "test",
  minutes = 30
) {
  return request<TransaccionDelCentral[]>(
    `/central-bank/transactions?environment=${environment}&minutes=${minutes}`
  );
}

export function sincronizarCuentaConCentral(
  idCuenta: string,
  environment: "test" | "prod" = "test"
) {
  return request<ResultadoSincronizacionCuenta>(`/central-bank/sync/accounts/${idCuenta}`, {
    method: "POST",
    body: JSON.stringify({ environment }),
  });
}

export function sincronizarCuentasEnLote(payload: {
  environment?: "test" | "prod";
  limit?: number;
  idsCuenta?: string[];
}) {
  return request<{
    processed: number;
    successCount: number;
    errorCount: number;
    results: { idCuenta: string; status: "success" | "error"; error?: string }[];
  }>("/central-bank/sync/accounts/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
