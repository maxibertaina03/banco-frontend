'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BankShell } from '@/components/layout/bank-shell';
import { Panel, SectionTitle, StatCard } from '@/components/ui/ui-kit';
import { fetchJson } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { AuthProfile, Persona, Transaccion, Usuario } from '@/types/banking';

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

export default function AdminPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAdmin() {
      try {
        const data = await fetchJson<AdminOverview>('/api/admin/overview');

        if (!cancelled) {
          setOverview(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error ? loadError.message : 'No se pudo cargar el panel admin.';
          setError(message);

          if (message.includes('No autorizado')) {
            router.push('/dashboard');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAdmin();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const totalObservedAmount = useMemo(() => {
    return (overview?.transacciones || []).reduce(
      (sum, transaction) => sum + Number(transaction.monto || 0),
      0
    );
  }, [overview]);

  return (
    <BankShell
      eyebrow="Orbital Admin"
      title="Panel administrativo"
      description="Supervisá usuarios, operaciones recientes y eventos de auditoría desde el panel interno."
      variant="admin"
      showAdminLink={false}
      showUserLink
    >
      {loading ? <Panel>Cargando panel administrativo...</Panel> : null}
      {error ? <Panel className="panel--danger">{error}</Panel> : null}

      {overview ? (
        <>
          <section className="stats-grid">
            <StatCard
              label="Personas visibles"
              value={String(overview.personas.length)}
              hint="Primer lote desde el endpoint interno de personas"
            />
            <StatCard
              label="Usuarios visibles"
              value={String(overview.usuarios.length)}
              hint="Resultado del recurso protegido de usuarios"
            />
            <StatCard
              label="Movimientos recientes"
              value={String(overview.transacciones.length)}
              hint={formatCurrency(totalObservedAmount)}
            />
            <StatCard
              label="Eventos de auditoría"
              value={String(overview.auditoria.length)}
              hint="Últimos registros internos"
            />
          </section>

          <section className="dashboard-grid">
            <Panel className="admin-panel-highlight">
              <SectionTitle
                title="Personas"
                description="Vista resumida de clientes o personas visibles para la sesión interna."
              />
              <div className="admin-table-list">
                {overview.personas.map((persona) => (
                  <article key={persona.id} className="admin-table-row">
                    <div>
                      <strong>
                        {persona.nombre} {persona.apellido}
                      </strong>
                      <p>{persona.email || 'Sin email'}</p>
                    </div>
                    <span>{persona.dni || 'Sin DNI'}</span>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel className="admin-panel-highlight">
              <SectionTitle
                title="Usuarios"
                description="Cuentas de acceso observadas desde el backend protegido."
              />
              <div className="admin-table-list">
                {overview.usuarios.map((usuario) => (
                  <article key={usuario.id} className="admin-table-row">
                    <div>
                      <strong>{usuario.clerk_id}</strong>
                      <p>Persona: {usuario.persona_id}</p>
                    </div>
                    <span>{usuario.activo ? 'Activo' : 'Inactivo'}</span>
                  </article>
                ))}
              </div>
            </Panel>
          </section>

          <section className="dashboard-grid">
            <Panel className="admin-panel-highlight">
              <SectionTitle
                title="Transacciones"
                description="Últimos movimientos visibles para la sesión admin."
              />
              <div className="admin-table-list">
                {overview.transacciones.slice(0, 8).map((transaction) => (
                  <article key={transaction.id} className="admin-table-row">
                    <div>
                      <strong>{transaction.tipo_transaccion_nombre || 'Operación'}</strong>
                      <p>{transaction.descripcion || 'Sin descripción'}</p>
                    </div>
                    <span>{formatCurrency(transaction.monto)}</span>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel className="admin-panel-highlight">
              <SectionTitle
                title="Auditoría reciente"
                description="Eventos recientes del registro de auditoría."
              />
              <div className="admin-table-list">
                {overview.auditoria.map((event) => (
                  <article key={event.id} className="admin-table-row">
                    <div>
                      <strong>
                        {event.accion} · {event.entidad}
                      </strong>
                      <p>{event.usuario_id || 'Sin usuario asociado'}</p>
                    </div>
                    <span>{formatDate(event.created_at)}</span>
                  </article>
                ))}
              </div>
            </Panel>
          </section>
        </>
      ) : null}
    </BankShell>
  );
}
