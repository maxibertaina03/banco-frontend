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
      const response = await fetch('/api/auth/profile', {
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
    <div className="onboarding-shell">
      <nav className="onboarding-shell__header">
        <div className="onboarding-shell__bar">
          <Link href="/" className="brand-mark">
            <span className="brand-mark__icon">O</span>
            <span>
              <strong>Orbital</strong>
              <small>Activación de perfil</small>
            </span>
          </Link>
          <UserButton />
        </div>
      </nav>

      <main className="onboarding-shell__content">
        <section className="panel panel--wide">
          <p className="page-eyebrow">Tu cuenta ya existe</p>
          <h1 className="page-title">Completá tu perfil operativo</h1>
          <p className="page-description">
            Estos datos viven en el backend del banco y habilitan el acceso al resto de los módulos protegidos.
          </p>

          <form onSubmit={handleSubmit} className="bank-form bank-form--two-columns">
            <label>
              <span>Nombre</span>
              <input
                value={form.nombre}
                onChange={(event) => updateField('nombre', event.target.value)}
                required
              />
            </label>

            <label>
              <span>Apellido</span>
              <input
                value={form.apellido}
                onChange={(event) => updateField('apellido', event.target.value)}
                required
              />
            </label>

            <label>
              <span>DNI</span>
              <input
                value={form.dni}
                onChange={(event) => updateField('dni', event.target.value)}
                required
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                required
              />
            </label>

            <label>
              <span>Teléfono</span>
              <input
                value={form.telefono}
                onChange={(event) => updateField('telefono', event.target.value)}
                required
              />
            </label>

            <label>
              <span>Fecha de nacimiento</span>
              <input
                type="date"
                value={form.fecha_nacimiento}
                onChange={(event) => updateField('fecha_nacimiento', event.target.value)}
                required
              />
            </label>

            {error ? <div className="form-error">{error}</div> : null}

            <button type="submit" disabled={saving} className="btn-primary bank-form__full">
              {saving ? 'Guardando perfil...' : 'Guardar y continuar'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
