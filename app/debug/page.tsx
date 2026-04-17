'use client';

import { useAuth, useUser } from '@clerk/nextjs';

export default function DebugPage() {
  const { isLoaded, userId, getToken } = useAuth();
  const { user } = useUser();

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
      <h1>🔍 Debug Clerk</h1>
      
      <section>
        <h2>Estado de Clerk:</h2>
        <pre style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '4px' }}>
{`isLoaded: ${isLoaded}
userId: ${userId || 'No autenticado'}
firstName: ${user?.firstName || 'sin dato'}
lastName: ${user?.lastName || 'sin dato'}
email: ${user?.primaryEmailAddress?.emailAddress || 'sin dato'}
`}
        </pre>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Variables de Entorno:</h2>
        <pre style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '4px' }}>
{`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? 'Configurada ✓'
    : 'NO CONFIGURADA ❌'
}

NEXT_PUBLIC_API_URL: ${
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
}
`}
        </pre>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>¿Qué causa el error "JSON.parse"?</h2>
        <ul style={{ fontSize: '14px', lineHeight: '1.8' }}>
          <li>❌ Publicable Key no está configurada o es inválida</li>
          <li>❌ http://localhost:3000 NO está en Authorized Origins en Clerk Dashboard</li>
          <li>❌ Las URLs de redirección no están configuradas en Clerk</li>
          <li>❌ CORS error: Clerk no puede acceder desde tu dominio</li>
        </ul>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>👉 Solución:</h2>
        <ol style={{ fontSize: '14px', lineHeight: '1.8' }}>
          <li>Ve a: https://dashboard.clerk.com</li>
          <li>Click en "Configure"</li>
          <li>Busca "Authorized Origins" o "Application URLs"</li>
          <li>Agrega: http://localhost:3000</li>
          <li>Guarda y recarga esta página</li>
        </ol>
      </section>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#ffe6e6', 
        borderLeft: '4px solid #ff0000',
        borderRadius: '4px'
      }}>
        <strong>⚠️ Si ves "JSON.parse error":</strong>
        <p>Abre la consola (F12 → Console) y copia el error exacto para investigar.</p>
      </div>
    </div>
  );
}
