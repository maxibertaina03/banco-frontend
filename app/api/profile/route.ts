import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

function getCandidateApiUrls() {
  return Array.from(
    new Set(
      [
        process.env.BACKEND_API_URL,
        process.env.NEXT_PUBLIC_API_URL,
        'http://localhost:3001',
      ].filter(Boolean)
    )
  ) as string[];
}

async function readJsonResponse(response: Response, candidate: string) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(
      `El backend en ${candidate} respondió ${response.status} con contenido no JSON: ${text.slice(0, 80)}`
    );
  }

  return response.json();
}

export async function GET() {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const clerkUser = await currentUser();
    const token = await getToken();
    const candidateApiUrls = getCandidateApiUrls();

    let backend: unknown = null;
    let backendError: string | null = null;
    let apiUrl = candidateApiUrls[0] || 'http://localhost:3001';

    if (token) {
      for (const candidate of candidateApiUrls) {
        try {
          const response = await fetch(`${candidate}/auth/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          });

          const data = await readJsonResponse(response, candidate);
          apiUrl = candidate;

          if (response.ok) {
            backend = data;
            backendError = null;
            break;
          }

          backendError =
            data.error || data.message || `Error al consultar el backend en ${candidate}`;
        } catch (error) {
          backendError =
            error instanceof Error
              ? `No se pudo conectar con ${candidate}: ${error.message}`
              : `No se pudo conectar con ${candidate}`;
        }
      }
    } else {
      backendError = 'No se pudo obtener el token de Clerk';
    }

    return NextResponse.json({
      auth: {
        isAuthenticated: Boolean(userId),
        userId,
        hasToken: Boolean(token),
      },
      clerkUser: clerkUser
        ? {
            id: clerkUser.id,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            username: clerkUser.username,
            imageUrl: clerkUser.imageUrl,
            primaryEmail:
              clerkUser.emailAddresses.find(
                (email) => email.id === clerkUser.primaryEmailAddressId
              )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || null,
          }
        : null,
      backend,
      backendError,
      apiUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const token = await getToken();
    if (!token) {
      return NextResponse.json(
        { error: 'No se pudo obtener el token de Clerk' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const candidateApiUrls = getCandidateApiUrls();
    let lastError = 'No se pudo conectar con el backend';

    for (const candidate of candidateApiUrls) {
      try {
        const response = await fetch(`${candidate}/auth/profile`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          cache: 'no-store',
        });

        const data = await readJsonResponse(response, candidate);

        if (response.ok) {
          return NextResponse.json(data);
        }

        lastError = data.error || data.message || `Error al consultar el backend en ${candidate}`;
      } catch (error) {
        lastError =
          error instanceof Error
            ? `No se pudo conectar con ${candidate}: ${error.message}`
            : `No se pudo conectar con ${candidate}`;
      }
    }

    return NextResponse.json({ error: lastError }, { status: 502 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
