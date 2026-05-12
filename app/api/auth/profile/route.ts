import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/api/backend-server';
import type { AuthProfile } from '@/types/banking';

export async function GET() {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const [clerkUser, token, backend] = await Promise.all([
      currentUser(),
      getToken(),
      fetchBackend<{ message: string; user: AuthProfile }>({
        path: '/auth/profile',
      }),
    ]);

    return NextResponse.json({
      auth: {
        isAuthenticated: true,
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
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 502 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const data = await fetchBackend({
      path: '/auth/profile',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 502 }
    );
  }
}
