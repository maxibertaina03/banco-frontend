import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/api/backend-server';
import { hasInternalRole } from '@/lib/access';
import type {
  AuthProfile,
  Persona,
  Transaccion,
  Usuario,
} from '@/types/banking';

type AdminOverview = {
  profile: AuthProfile;
  personas: Persona[];
  usuarios: Usuario[];
  transacciones: Transaccion[];
  auditoria: Array<{
    id: string;
    accion: string;
    entidad: string;
    created_at: string;
    usuario_id?: string | null;
  }>;
};

export async function GET() {
  try {
    const profileResponse = await fetchBackend<{ message: string; user: AuthProfile }>({
      path: '/auth/profile',
    });

    const profile = profileResponse.user;
    const roleNames = profile.roles.map((role) => role.nombre);

    if (!hasInternalRole(roleNames)) {
      return NextResponse.json({ error: 'No autorizado para acceder al panel admin.' }, { status: 403 });
    }

    const [personas, usuarios, transacciones, auditoria] = await Promise.all([
      fetchBackend<{ data: Persona[] }>({ path: '/api/personas?limit=8' }),
      fetchBackend<{ data: Usuario[] }>({ path: '/api/usuarios?limit=8' }),
      fetchBackend<{ data: Transaccion[] }>({ path: '/api/transacciones' }),
      fetchBackend<{ data: Array<{ id: string; accion: string; entidad: string; created_at: string; usuario_id?: string | null }> }>({
        path: '/api/auditoria?limit=8',
      }),
    ]);

    return NextResponse.json({
      profile,
      personas: personas.data,
      usuarios: usuarios.data,
      transacciones: transacciones.data,
      auditoria: auditoria.data,
    } satisfies AdminOverview);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo cargar el panel admin.' },
      { status: 502 }
    );
  }
}
