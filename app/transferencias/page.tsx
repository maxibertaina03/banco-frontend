'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BankShell } from '@/components/layout/bank-shell';
import { EmptyState, Panel, SectionTitle } from '@/components/ui/ui-kit';
import { fetchJson } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils';
import type { Cuenta, TipoTransaccion, TransferPayload, Transaccion } from '@/types/banking';

type TransferMetadata = {
  cuentas: Cuenta[];
  tiposTransaccion: TipoTransaccion[];
};

export default function TransferenciasPage() {
  const router = useRouter();
  const [metadata, setMetadata] = useState<TransferMetadata | null>(null);
  const [result, setResult] = useState<Transaccion | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    tipo_transaccion_id: '',
    cuenta_origen_id: '',
    cuenta_destino_id: '',
    monto: '',
    descripcion: '',
  });

  useEffect(() => {
    let cancelled = false;

    async function loadMetadata() {
      try {
        const data = await fetchJson<TransferMetadata>('/api/transferencias/metadata');

        if (cancelled) {
          return;
        }

        setMetadata(data);
        setForm((current) => ({
          ...current,
          tipo_transaccion_id: current.tipo_transaccion_id || data.tiposTransaccion[0]?.id || '',
          cuenta_origen_id: current.cuenta_origen_id || data.cuentas[0]?.id || '',
          cuenta_destino_id:
            current.cuenta_destino_id || data.cuentas.find((cuenta) => cuenta.id !== data.cuentas[0]?.id)?.id || '',
        }));
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : 'No se pudo cargar la metadata de transferencias.';

          setError(message);
          if (message.includes('Perfil incompleto')) {
            router.push('/onboarding/profile');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const originAccount = useMemo(
    () => metadata?.cuentas.find((cuenta) => cuenta.id === form.cuenta_origen_id) || null,
    [form.cuenta_origen_id, metadata]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setResult(null);

    try {
      const payload: TransferPayload = {
        tipo_transaccion_id: form.tipo_transaccion_id,
        cuenta_origen_id: form.cuenta_origen_id,
        cuenta_destino_id: form.cuenta_destino_id || null,
        monto: Number(form.monto),
        descripcion: form.descripcion.trim() || null,
      };

      const data = await fetchJson<Transaccion>('/api/transferencias', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setResult(data);
      setForm((current) => ({
        ...current,
        monto: '',
        descripcion: '',
      }));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo registrar la transferencia.'
      );
    } finally {
      setSaving(false);
    }
  }

  const availableDestinationAccounts =
    metadata?.cuentas.filter((cuenta) => cuenta.id !== form.cuenta_origen_id) || [];

  return (
    <BankShell
      eyebrow="Operaciones"
      title="Transferencias Orbital"
      description="Realizá transferencias entre cuentas habilitadas y controlá el saldo disponible antes de operar."
    >
      {loading ? <Panel>Cargando datos para operar...</Panel> : null}
      {error ? <Panel className="panel--danger">{error}</Panel> : null}

      <section className="dashboard-grid">
        <Panel>
          <SectionTitle
            title="Nueva transferencia"
            description="Usa los tipos de transacción expuestos por el backend y valida el saldo antes de operar."
          />

          {!metadata || metadata.cuentas.length < 2 ? (
            <EmptyState
              title="Faltan cuentas para transferir"
              description="Necesitás al menos dos cuentas activas visibles para poder probar transferencias internas."
            />
          ) : (
            <form className="bank-form" onSubmit={handleSubmit}>
              <label>
                <span>Tipo de transacción</span>
                <select
                  value={form.tipo_transaccion_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tipo_transaccion_id: event.target.value,
                    }))
                  }
                  required
                >
                  {metadata.tiposTransaccion.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Cuenta origen</span>
                <select
                  value={form.cuenta_origen_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      cuenta_origen_id: event.target.value,
                      cuenta_destino_id:
                        current.cuenta_destino_id === event.target.value ? '' : current.cuenta_destino_id,
                    }))
                  }
                  required
                >
                  {metadata.cuentas.map((cuenta) => (
                    <option key={cuenta.id} value={cuenta.id}>
                      {cuenta.tipo_cuenta_nombre || 'Cuenta'} · {cuenta.alias || cuenta.numero_cuenta}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Cuenta destino</span>
                <select
                  value={form.cuenta_destino_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      cuenta_destino_id: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Seleccioná una cuenta</option>
                  {availableDestinationAccounts.map((cuenta) => (
                    <option key={cuenta.id} value={cuenta.id}>
                      {cuenta.tipo_cuenta_nombre || 'Cuenta'} · {cuenta.alias || cuenta.numero_cuenta}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Monto</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.monto}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      monto: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="bank-form__full">
                <span>Descripción</span>
                <textarea
                  rows={4}
                  value={form.descripcion}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      descripcion: event.target.value,
                    }))
                  }
                  placeholder="Ejemplo: movimiento entre caja de ahorro y cuenta corriente"
                />
              </label>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Procesando transferencia...' : 'Transferir ahora'}
              </button>
            </form>
          )}
        </Panel>

        <Panel>
          <SectionTitle
            title="Contexto de operación"
            description="Antes de confirmar, mostramos el saldo disponible de la cuenta elegida."
          />
          {originAccount ? (
            <div className="stack-list">
              <article className="account-row">
                <div>
                  <strong>{originAccount.tipo_cuenta_nombre || 'Cuenta de origen'}</strong>
                  <p>{originAccount.alias || originAccount.cbu}</p>
                </div>
                <strong>{formatCurrency(originAccount.saldo)}</strong>
              </article>
            </div>
          ) : (
            <EmptyState
              title="Sin cuenta origen seleccionada"
              description="Elegí una cuenta para ver su saldo disponible."
            />
          )}

          {result ? (
            <div className="result-card">
              <span>Transferencia registrada</span>
              <strong>{formatCurrency(result.monto)}</strong>
              <p>{result.descripcion || 'Sin descripción adicional'}</p>
            </div>
          ) : null}
        </Panel>
      </section>
    </BankShell>
  );
}
