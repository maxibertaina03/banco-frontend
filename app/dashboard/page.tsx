'use client';

import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;

    const fetchProfile = async () => {
      try {
        const token = await getToken();
        const response = await fetch('/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        } else {
          const data = await response.json().catch(() => null);
          setError(data?.error || 'Error al cargar el perfil');
        }
      } catch (err) {
        setError('Error al conectar con el servidor');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isSignedIn, getToken]);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <p className="text-white mb-4">Por favor inicia sesión primero</p>
          <Link href="/auth/sign-in">
            <button className="btn-primary w-full">Ir a Login</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <nav className="bg-black bg-opacity-30 border-b border-white border-opacity-10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-white">
            🏦 Banco
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-300 text-sm">
              {user?.firstName} {user?.lastName}
            </span>
            <UserButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Welcome Card */}
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-4">
              Bienvenido
            </h2>
            <div className="space-y-3 text-gray-200">
              <p>
                <span className="text-gray-400">Email:</span>{' '}
                {user?.primaryEmailAddress?.emailAddress}
              </p>
              <p>
                <span className="text-gray-400">ID Clerk:</span>{' '}
                <code className="bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
                  {user?.id}
                </code>
              </p>
            </div>
          </div>

          {/* API Status */}
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-4">
              Estado de la API
            </h2>
            {loading && (
              <p className="text-gray-300">Verificando conexión...</p>
            )}
            {error && (
              <p className="text-red-400">{error}</p>
            )}
            {profile && (
              <div className="space-y-2">
                <p className="text-green-400">✓ Clerk respondió correctamente</p>
                {profile.backend && (
                  <p className="text-green-400">✓ Backend vinculado correctamente</p>
                )}
                {profile.backendError && (
                  <p className="text-yellow-300">Backend pendiente: {profile.backendError}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile Data */}
        {profile && (
          <div className="card mt-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Datos del Perfil
            </h2>
            <pre className="bg-black bg-opacity-50 p-4 rounded text-xs text-gray-200 overflow-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <button className="card text-center hover:bg-opacity-20 transition">
            <h3 className="text-white font-semibold mb-2">💰 Cuentas</h3>
            <p className="text-gray-400 text-sm">Gestionar tus cuentas</p>
          </button>
          <button className="card text-center hover:bg-opacity-20 transition">
            <h3 className="text-white font-semibold mb-2">📤 Transferencias</h3>
            <p className="text-gray-400 text-sm">Enviar dinero</p>
          </button>
          <button className="card text-center hover:bg-opacity-20 transition">
            <h3 className="text-white font-semibold mb-2">📊 Historial</h3>
            <p className="text-gray-400 text-sm">Ver transacciones</p>
          </button>
        </div>
      </div>
    </div>
  );
}
