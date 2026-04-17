import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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
    const candidateApiUrls = Array.from(
      new Set(
        [
          process.env.BACKEND_API_URL,
          process.env.NEXT_PUBLIC_API_URL,
          'http://localhost:3001',
          'http://localhost:3000',
        ].filter(Boolean)
      )
    ) as string[];

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

          const data = await response.json();
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
