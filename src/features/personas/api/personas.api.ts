import { request, requestAbsolute } from "../../../lib/api/client";
import type {
  AuditRecord,
  AdminCentralRegistrationResult,
  CentralBankRecord,
  CentralBankAccountSyncResult,
  CentralBankRenameResult,
  CentralBankTransactionRecord,
  CentralPersonLookupResult,
  AuthenticatedUserProfile,
  PersonaFullResponse,
  PersonaOption,
  PortalRole,
  RoleRecord,
  SyncAccountRecord,
  UserRecord,
} from "../types/personas.types";

export type {
  AuditRecord,
  AdminCentralRegistrationResult,
  CentralBankRecord,
  CentralBankAccountSyncResult,
  CentralBankRenameResult,
  CentralBankTransactionRecord,
  CentralPersonLookupResult,
  AuthenticatedUserProfile,
  PersonaFullResponse,
  PersonaOption,
  PortalRole,
  RoleRecord,
  SyncAccountRecord,
  UserRecord,
} from "../types/personas.types";

interface ListResponse<T> {
  data: T[];
}

export function sanitizePersonaId(value?: string | null) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  if (normalized.includes("/") || normalized.toLowerCase().includes("api")) {
    return "";
  }

  return normalized;
}

function normalizeRole(roleName: string): PortalRole | null {
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

export function getRoleScope(role: PortalRole) {
  return role === "cliente" ? "user" : "admin";
}

export function getRoleOptions(full: PersonaFullResponse): PortalRole[] {
  const roles = full.roles
    .map((role) => normalizeRole(role.nombre.toLowerCase()))
    .filter((role): role is PortalRole => Boolean(role));

  if (roles.length > 0) {
    return Array.from(new Set(roles));
  }

  return ["cliente"];
}

export async function listPersonas() {
  const response = await request<ListResponse<PersonaOption>>("/personas?limit=100");
  return response.data;
}

export async function listRoles() {
  const response = await request<ListResponse<RoleRecord>>("/roles?limit=50");
  return response.data;
}

export function getAuthenticatedUserProfile() {
  return requestAbsolute<{ message: string; user: AuthenticatedUserProfile }>("/auth/profile");
}

export function loginAuthenticatedUser() {
  return requestAbsolute<{ message: string; user: AuthenticatedUserProfile }>("/auth/login", {
    method: "POST",
  });
}

export function completeAuthenticatedUserProfile(payload: {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
}) {
  return requestAbsolute<{
    message: string;
    user: AuthenticatedUserProfile;
    centralBank: { status: number; message: string; cbu: string | null; alias: string | null } | null;
  }>("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function listAccountsForSync(options?: { environment?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (options?.environment) params.set("environment", options.environment);
  if (options?.limit) params.set("limit", String(options.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<{ accounts: SyncAccountRecord[] }>(`/central-bank/sync/accounts${query}`);
}

export function getPersonaFull(personaId: string) {
  return request<PersonaFullResponse>(`/personas/${personaId}/full`);
}

export function getUserAudit(usuarioId: string) {
  return request<AuditRecord[]>(`/usuarios/${usuarioId}/auditoria`);
}

export function createPersona(payload: {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
}) {
  return request<PersonaOption>("/personas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePersona(
  personaId: string,
  payload: Partial<{
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
    fecha_nacimiento: string | null;
  }>
) {
  return request<PersonaOption>(`/personas/${personaId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function createUsuario(payload: {
  persona_id: string;
  clerk_id: string;
  activo?: boolean;
}) {
  return request<UserRecord>("/usuarios", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUsuario(
  usuarioId: string,
  payload: Partial<{
    clerk_id: string;
    activo: boolean;
  }>
) {
  return request<UserRecord>(`/usuarios/${usuarioId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function assignPersonaRole(payload: { persona_id: string; rol_id: string }) {
  return request("/personas-roles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerPersonFromAdmin(payload: {
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
  return request<CentralBankTransactionRecord[]>(
    `/central-bank/transactions?environment=${environment}&minutes=${minutes}`
  );
}

export function syncCentralBankAccount(
  accountId: string,
  environment: "test" | "prod" = "test"
) {
  return request<CentralBankAccountSyncResult>(`/central-bank/sync/accounts/${accountId}`, {
    method: "POST",
    body: JSON.stringify({ environment }),
  });
}

export function bulkSyncAccounts(payload: {
  environment?: "test" | "prod";
  limit?: number;
  accountIds?: string[];
}) {
  return request<{
    processed: number;
    successCount: number;
    errorCount: number;
    results: { accountId: string; status: "success" | "error"; error?: string }[];
  }>("/central-bank/sync/accounts/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
