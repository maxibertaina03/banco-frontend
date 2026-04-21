'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    fecha_nacimiento: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo completar el perfil');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-black bg-opacity-30 border-b border-white border-opacity-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-white">
            Banco
          </Link>
          <UserButton />
        </div>
      </nav>

      <main className="container max-w-3xl">
        <section className="card mt-10">
          <p className="text-blue-300 text-sm font-semibold mb-2">Un paso más</p>
          <h1 className="text-3xl font-bold text-white mb-3">Completá tu perfil</h1>
          <p className="text-gray-300 mb-8">
            Tu cuenta ya está creada con Clerk. Estos datos quedan solo en el banco y nos permiten habilitar las funciones de la plataforma.
          </p>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-gray-300 text-sm">Nombre</span>
              <input
                className="mt-2 w-full rounded-lg bg-black bg-opacity-40 border border-white border-opacity-10 px-4 py-3 text-white outline-none focus:border-blue-400"
                value={form.nombre}
                onChange={(event) => updateField('nombre', event.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="text-gray-300 text-sm">Apellido</span>
              <input
                className="mt-2 w-full rounded-lg bg-black bg-opacity-40 border border-white border-opacity-10 px-4 py-3 text-white outline-none focus:border-blue-400"
                value={form.apellido}
                onChange={(event) => updateField('apellido', event.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="text-gray-300 text-sm">DNI</span>
              <input
                className="mt-2 w-full rounded-lg bg-black bg-opacity-40 border border-white border-opacity-10 px-4 py-3 text-white outline-none focus:border-blue-400"
                value={form.dni}
                onChange={(event) => updateField('dni', event.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="text-gray-300 text-sm">Email</span>
              <input
                type="email"
                className="mt-2 w-full rounded-lg bg-black bg-opacity-40 border border-white border-opacity-10 px-4 py-3 text-white outline-none focus:border-blue-400"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="text-gray-300 text-sm">Teléfono</span>
              <input
                className="mt-2 w-full rounded-lg bg-black bg-opacity-40 border border-white border-opacity-10 px-4 py-3 text-white outline-none focus:border-blue-400"
                value={form.telefono}
                onChange={(event) => updateField('telefono', event.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="text-gray-300 text-sm">Fecha de nacimiento</span>
              <input
                type="date"
                className="mt-2 w-full rounded-lg bg-black bg-opacity-40 border border-white border-opacity-10 px-4 py-3 text-white outline-none focus:border-blue-400"
                value={form.fecha_nacimiento}
                onChange={(event) => updateField('fecha_nacimiento', event.target.value)}
                required
              />
            </label>

            {error && (
              <div className="md:col-span-2 rounded-lg border border-red-400 border-opacity-40 bg-red-500 bg-opacity-10 px-4 py-3 text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn-primary md:col-span-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Completar perfil'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
