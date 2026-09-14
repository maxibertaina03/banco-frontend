const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

type AccessTokenProvider = () => Promise<string | null>;

let accessTokenProvider: AccessTokenProvider | null = null;

export class ApiError extends Error {
  status: number;
  details: unknown;
  code?: string;
  // Body crudo de la respuesta. Hace falta cuando un status de error trae un
  // resultado de negocio y no un `{ error }`: la autorización rechazada con 422.
  payload: unknown;

  constructor(message: string, options: { status: number; details?: unknown; code?: string; payload?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.details = options.details ?? null;
    this.code = options.code;
    this.payload = options.payload ?? null;
  }
}

export function setAccessTokenProvider(provider: AccessTokenProvider | null) {
  accessTokenProvider = provider;
}

// Opciones extendidas: agregamos `idempotencyKey` para operaciones que el
// backend protege con la tabla `idempotency_keys` (transferencias).
export interface RequestOptions extends Omit<RequestInit, "headers"> {
  headers?: HeadersInit;
  idempotencyKey?: string;
}

async function buildHeaders(init?: RequestOptions) {
  const token = accessTokenProvider ? await accessTokenProvider() : null;
  const headers = new Headers(init?.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init?.idempotencyKey) {
    headers.set("Idempotency-Key", init.idempotencyKey);
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const details = payload?.details ?? null;
    const baseMessage = payload?.error || payload?.message || "No se pudo completar la solicitud.";
    const detailMessage = typeof details === "string" ? details : typeof payload?.message === "string" ? payload.message : "";
    const code =
      typeof payload?.code === "string"
        ? payload.code
        : typeof details === "object" && details !== null && "code" in details && typeof details.code === "string"
          ? details.code
          : undefined;

    throw new ApiError(detailMessage && detailMessage !== baseMessage ? `${baseMessage} ${detailMessage}` : baseMessage, {
      status: response.status,
      details,
      code,
      payload,
    });
  }

  return response.json() as Promise<T>;
}

// Separa nuestras extensiones de las opciones nativas de fetch antes de pasar
// el objeto a `fetch`. También evita que un caller sobrescriba accidentalmente
// los headers calculados (Authorization, Content-Type, Idempotency-Key).
function toFetchInit(headers: Headers, options?: RequestOptions): RequestInit {
  if (!options) return { headers };
  const { idempotencyKey: _idempotencyKey, headers: _headers, ...rest } = options;
  return { ...rest, headers };
}

export async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const headers = await buildHeaders(init);
  const response = await fetch(`${API_BASE_URL}${path}`, toFetchInit(headers, init));
  return handleResponse<T>(response);
}

// Para respuestas que no son JSON (el CSV de movimientos). No se puede usar un
// `<a href>` directo porque la descarga necesita el header Authorization.
export async function requestArchivo(path: string): Promise<{ blob: Blob; nombre: string | null }> {
  const headers = await buildHeaders();
  const response = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!response.ok) {
    await handleResponse<never>(response);
  }
  const disposicion = response.headers.get("Content-Disposition") || "";
  const nombre = /filename="([^"]+)"/.exec(disposicion)?.[1] ?? null;
  return { blob: await response.blob(), nombre };
}

// Una clave por intento de operación. Se genera al abrir el formulario y se
// reutiliza si el usuario reintenta, así un doble click no mueve plata dos veces.
export function nuevaClaveIdempotencia() {
  // `randomUUID` sólo existe en contexto seguro (https o localhost): abriendo el
  // portal por la IP de la red desde un celular no está, y la pantalla rompía.
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versión 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function requestAbsolute<T>(path: string, init?: RequestOptions): Promise<T> {
  const headers = await buildHeaders(init);
  const response = await fetch(path, toFetchInit(headers, init));
  return handleResponse<T>(response);
}
