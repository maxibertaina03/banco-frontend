'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BankShell } from '@/components/layout/bank-shell';
import { EmptyState, Panel, SectionTitle } from '@/components/ui/ui-kit';
import { fetchJson } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Cuenta, Transaccion } from '@/types/banking';

export default function CuentasPage() {
  const router = useRouter();
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [movimientos, setMovimientos] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAccounts() {
      try {
        const data = await fetchJson<Cuenta[]>('/api/cuentas');

        if (cancelled) {
          return;
        }

        setCuentas(data);
        setSelectedAccountId((current) => current || data[0]?.id || null);
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error ? loadError.message : 'No se pudieron cargar las cuentas.';

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

    void loadAccounts();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!selectedAccountId) {
      setMovimientos([]);
      return;
    }

    let cancelled = false;

    async function loadMovements() {
      setMovementsLoading(true);

      try {
        const data = await fetchJson<Transaccion[]>(
          `/api/cuentas/${selectedAccountId}/movimientos`
        );

        if (!cancelled) {
          setMovimientos(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar los movimientos.'
          );
        }
      } finally {
        if (!cancelled) {
          setMovementsLoading(false);
        }
      }
    }

    void loadMovements();

    return () => {
      cancelled = true;
    };
  }, [selectedAccountId]);

  return (
    <BankShell
      eyebrow="Tesorería personal"
      title="Cuentas y movimientos Orbital"
      description="Revisá el detalle de tus cuentas, su saldo disponible y el historial de movimientos."
    >
      {loading ? <Panel>Cargando tus cuentas...</Panel> : null}
      {error ? <Panel className="panel--danger">{error}</Panel> : null}

      <section className="dashboard-grid">
        <Panel>
          <SectionTitle
            title="Tus cuentas"
            description="Elegí una cuenta para ver su historial."
          />
          {cuentas.length === 0 ? (
            <EmptyState
              title="No encontramos cuentas"
              description="Todavía no hay cuentas cargadas para esta persona en el backend."
            />
          ) : (
            <div className="stack-list">
              {cuentas.map((cuenta) => (
                <button
                  key={cuenta.id}
                  type="button"
                  onClick={() => setSelectedAccountId(cuenta.id)}
                  className={
                    selectedAccountId === cuenta.id ? 'account-selector is-active' : 'account-selector'
                  }
                >
                  <div>
                    <strong>{cuenta.tipo_cuenta_nombre || 'Cuenta bancaria'}</strong>
                    <p>{cuenta.alias || cuenta.cbu}</p>
                  </div>
                  <strong>{formatCurrency(cuenta.saldo)}</strong>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <SectionTitle
            title="Movimientos de la cuenta"
            description="Cada cuenta consulta su propio historial con un endpoint protegido."
          />
          {movementsLoading ? <p className="muted-copy">Consultando movimientos...</p> : null}
          {!movementsLoading && movimientos.length === 0 ? (
            <EmptyState
              title="Sin movimientos para esta cuenta"
              description="Cuando haya actividad bancaria, la vas a ver ordenada de más reciente a más antigua."
            />
          ) : null}
          <div className="stack-list">
            {movimientos.map((movimiento) => (
              <article key={movimiento.id} className="movement-row">
                <div>
                  <strong>{movimiento.tipo_transaccion_nombre || 'Operación'}</strong>
                  <p>{movimiento.descripcion || 'Sin descripción'}</p>
                </div>
                <div className="movement-row__meta">
                  <strong>{formatCurrency(movimiento.monto)}</strong>
                  <span>{formatDate(movimiento.created_at)}</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </BankShell>
  );
}
