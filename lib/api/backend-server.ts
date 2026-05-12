import { auth } from '@clerk/nextjs/server';

const FALLBACK_API_URL = 'http://localhost:3001';

type BackendFetchOptions = RequestInit & {
  path: string;
  includeAuth?: boolean;
};

function getCandidateApiUrls() {
  return Array.from(
    new Set(
      [
        process.env.BACKEND_API_URL,
        process.env.NEXT_PUBLIC_API_URL,
        FALLBACK_API_URL,
      ].filter(Boolean)
    )
  ) as string[];
}

async function parseBackendResponse(response: Response, candidate: string) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(
      `El backend en ${candidate} respondió ${response.status} con contenido no JSON: ${text.slice(0, 120)}`
    );
  }

  return response.json();
}

export async function fetchBackend<T>({
  path,
  includeAuth = true,
  headers,
  ...init
}: BackendFetchOptions): Promise<T> {
  const { getToken } = await auth();
  const token = includeAuth ? await getToken() : null;

  if (includeAuth && !token) {
    throw new Error('No se pudo obtener el token de Clerk.');
  }

  const candidates = getCandidateApiUrls();
  let lastError = `No se pudo conectar con el backend para ${path}`;

  for (const candidate of candidates) {
    try {
      const response = await fetch(`${candidate}${path}`, {
        ...init,
        headers: {
          ...(headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });

      const data = await parseBackendResponse(response, candidate);

      if (!response.ok) {
        lastError =
          data?.error ||
          data?.message ||
          `El backend respondió ${response.status} en ${candidate}${path}`;
        continue;
      }

      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
    }
  }

  throw new Error(lastError);
}
