import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/api/backend-server';
import type { AuthProfile, Cuenta, TipoTransaccion } from '@/types/banking';

export async function GET() {
  try {
    const profileResponse = await fetchBackend<{ message: string; user: AuthProfile }>({
      path: '/auth/profile',
    });

    if (!profileResponse.user.perfil_completo) {
      return NextResponse.json({ error: 'Perfil incompleto.' }, { status: 409 });
    }

    const [cuentas, tiposTransaccion] = await Promise.all([
      fetchBackend<Cuenta[]>({
        path: `/api/personas/${profileResponse.user.persona_id}/cuentas`,
      }),
      fetchBackend<TipoTransaccion[]>({
        path: '/api/catalogos/transferencias',
      }),
    ]);

    return NextResponse.json({
      cuentas: cuentas.filter((cuenta) => cuenta.activa),
      tiposTransaccion,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'No se pudo cargar la metadata de transferencias.',
      },
      { status: 502 }
    );
  }
}
