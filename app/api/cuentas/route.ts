import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/api/backend-server';
import type { AuthProfile, Cuenta } from '@/types/banking';

export async function GET() {
  try {
    const profileResponse = await fetchBackend<{ message: string; user: AuthProfile }>({
      path: '/auth/profile',
    });

    if (!profileResponse.user.perfil_completo) {
      return NextResponse.json({ error: 'Perfil incompleto.' }, { status: 409 });
    }

    const cuentas = await fetchBackend<Cuenta[]>({
      path: `/api/personas/${profileResponse.user.persona_id}/cuentas`,
    });

    return NextResponse.json(cuentas);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudieron obtener las cuentas.' },
      { status: 502 }
    );
  }
}
