import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/api/backend-server';
import type {
  AuthProfile,
  DashboardOverview,
  DashboardOverviewPayload,
  PersonaFullResponse,
  TipoTransaccion,
  Transaccion,
} from '@/types/banking';

function isInternalUser(roleNames: string[]) {
  return roleNames.some((role) => ['admin', 'operador', 'auditor', 'tesoreria'].includes(role));
}

export async function GET() {
  try {
    const profileResponse = await fetchBackend<{ message: string; user: AuthProfile }>({
      path: '/auth/profile',
    });

    const profile = profileResponse.user;
    const roleNames = profile.roles.map((role) => role.nombre);

    if (!profile.perfil_completo) {
      return NextResponse.json({
        profile,
        persona: null,
        usuario: null,
        cuentas: [],
        destinatarios: [],
        roles: profile.roles,
        transacciones: [],
        tiposTransaccion: [],
        isInternalUser: isInternalUser(roleNames),
        requiresOnboarding: true,
      } satisfies DashboardOverviewPayload);
    }

    const [fullProfile, transacciones, tiposTransaccion] = await Promise.all([
      fetchBackend<PersonaFullResponse>({
        path: `/api/personas/${profile.persona_id}/full`,
      }),
      fetchBackend<{ count: number; data: Transaccion[] }>({
        path: '/api/transacciones',
      }),
      fetchBackend<TipoTransaccion[]>({
        path: '/api/catalogos/transferencias',
      }),
    ]);

    return NextResponse.json({
      profile,
      persona: fullProfile.persona,
      usuario: fullProfile.usuario,
      cuentas: fullProfile.cuentas,
      destinatarios: fullProfile.destinatarios,
      roles: fullProfile.roles,
      transacciones: transacciones.data,
      tiposTransaccion,
      isInternalUser: isInternalUser(roleNames),
      requiresOnboarding: false,
    } satisfies DashboardOverview);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo cargar el overview.' },
      { status: 502 }
    );
  }
}
