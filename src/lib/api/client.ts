const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

type AccessTokenProvider = () => Promise<string | null>;

let accessTokenProvider: AccessTokenProvider | null = null;

export class ApiError extends Error {
  status: number;
  details: unknown;
  code?: string;

  constructor(message: string, options: { status: number; details?: unknown; code?: string }) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.details = options.details ?? null;
    this.code = options.code;
  }
}

export function setAccessTokenProvider(provider: AccessTokenProvider | null) {
  accessTokenProvider = provider;
}

async function buildHeaders(init?: RequestInit) {
  const token = accessTokenProvider ? await accessTokenProvider() : null;
  const headers = new Headers(init?.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
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
    });
  }

  return response.json() as Promise<T>;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await buildHeaders(init);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...init,
  });

  return handleResponse<T>(response);
}

export async function requestAbsolute<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await buildHeaders(init);

  const response = await fetch(path, {
    headers,
    ...init,
  });

  return handleResponse<T>(response);
}
