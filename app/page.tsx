'use client';

import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';

export default function Home() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold text-white mb-6">
          🏦 Banco App
        </h1>
        
        <p className="text-xl text-gray-200 mb-8">
          Plataforma bancaria segura con autenticación moderna
        </p>

        {!isSignedIn ? (
          <div className="space-y-4">
            <p className="text-gray-300 mb-6">
              Inicia sesión o crea una cuenta para acceder a tu banca
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-in">
                <button className="btn-primary w-full sm:w-auto">
                  Iniciar Sesión
                </button>
              </Link>
              <Link href="/auth/sign-up">
                <button className="btn-secondary w-full sm:w-auto">
                  Crear Cuenta
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white bg-opacity-5 rounded-lg p-4">
              <p className="text-gray-200 mb-2">Bienvenido,</p>
              <h2 className="text-3xl font-bold text-white mb-4">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-gray-300">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>

            <Link href="/dashboard">
              <button className="btn-primary w-full">
                Ir al Dashboard
              </button>
            </Link>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-white border-opacity-20">
          <p className="text-sm text-gray-400">
            Backend API: <span className="text-green-400">✓ Conectado</span>
          </p>
        </div>
      </div>
    </div>
  );
}
