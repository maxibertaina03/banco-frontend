import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/api/backend-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const data = await fetchBackend({
      path: '/api/transacciones/operar',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'No se pudo registrar la transferencia.',
      },
      { status: 502 }
    );
  }
}
