import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/api/backend-server';
import type { Transaccion } from '@/types/banking';

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const movimientos = await fetchBackend<Transaccion[]>({
      path: `/api/cuentas/${params.id}/transacciones`,
    });

    return NextResponse.json(movimientos);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'No se pudieron obtener los movimientos.',
      },
      { status: 502 }
    );
  }
}
