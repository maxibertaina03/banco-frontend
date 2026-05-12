'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { BankShell } from '@/components/layout/bank-shell';
import { OrbitalAccountCard } from '@/components/user/orbital-account-card';
import { OrbitalProductCard } from '@/components/user/orbital-product-card';
import { OrbitalQuickActions } from '@/components/user/orbital-quick-actions';
import { OrbitalRecentActivity } from '@/components/user/orbital-recent-activity';
import { EmptyState, Panel, SectionTitle, StatCard } from '@/components/ui/ui-kit';
import { hasInternalRole } from '@/lib/access';
import { fetchJson } from '@/lib/api/client';
import { formatCurrency, getRoleLabel } from '@/lib/utils';
import type { DashboardOverview, DashboardOverviewPayload } from '@/types/banking';

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const accountsRef = useRef<HTMLDivElement | null>(null);
  const activityRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.push('/auth/sign-in');
      return;
    }

    let cancelled = false;

    async function loadOverview() {
      try {
        const data = await fetchJson<DashboardOverviewPayload>('/api/me/overview');

        if (cancelled) {
          return;
        }

        if (data.requiresOnboarding) {
          router.push('/onboarding/profile');
          return;
        }

        setOverview(data as DashboardOverview);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el dashboard.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, router]);

  const totalBalance = useMemo(() => {
    return (overview?.cuentas || []).reduce((sum, cuenta) => sum + Number(cuenta.saldo || 0), 0);
  }, [overview]);

  const recentTransactions = overview?.transacciones.slice(0, 5) || [];
  const roleNames = overview?.roles.map((role) => role.nombre) || [];
  const shellVariant = 'user';
  const canAccessAdmin = hasInternalRole(roleNames);

  function scrollToRef(ref: RefObject<HTMLDivElement>) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function copyPrimaryCbu() {
    const cbu = overview?.cuentas.find((account) => account.cbu)?.cbu;
    if (!cbu) {
      return;
    }

    try {
      await navigator.clipboard.writeText(cbu);
    } catch (_error) {
      setError('No se pudo copiar el CBU al portapapeles.');
    }
  }

  return (
    <BankShell
      eyebrow="Centro de operaciones"
      title="Resumen Orbital"
      description="Consultá el estado general de tus cuentas, movimientos recientes y accesos disponibles."
      variant={shellVariant}
      showAdminLink={canAccessAdmin}
    >
      {loading ? <Panel>Preparando tu tablero financiero...</Panel> : null}
      {error ? <Panel className="panel--danger">{error}</Panel> : null}

      {overview ? (
        <>
          <section className="orbital-hero">
            <div className="orbital-hero__balance">
              <div className="orbital-hero__eyebrow">Balance total</div>
              <strong>{formatCurrency(totalBalance)}</strong>
              <p>
                {overview.cuentas.length} cuenta(s) conectadas y {overview.transacciones.length} movimientos cargados.
              </p>
            </div>
            <div className="orbital-hero__summary">
              <div className="orbital-summary-pill">
                <span>Perfil</span>
                <strong>{overview.profile.perfil_completo ? 'Completo' : 'Pendiente'}</strong>
              </div>
              <div className="orbital-summary-pill">
                <span>Destinatarios</span>
                <strong>{overview.destinatarios.length}</strong>
              </div>
              <div className="orbital-summary-pill">
                <span>Acceso</span>
                <strong>{getRoleLabel(roleNames)}</strong>
              </div>
            </div>
          </section>

          <section className="stats-grid">
            <StatCard
              label="Saldo total"
              value={formatCurrency(totalBalance)}
              hint={`${overview.cuentas.length} cuenta(s) activas detectadas`}
            />
            <StatCard
              label="Movimientos recientes"
              value={String(overview.transacciones.length)}
              hint="Se consultan los últimos 100 movimientos disponibles"
            />
            <StatCard
              label="Perfil"
              value={overview.profile.perfil_completo ? 'Completo' : 'Pendiente'}
              hint={overview.profile.email || 'Sin email de negocio cargado'}
            />
            <StatCard
              label="Acceso"
              value={getRoleLabel(roleNames)}
              hint={roleNames.join(', ') || 'cliente'}
            />
          </section>

          <section className="orbital-user-grid">
            <Panel>
              <SectionTitle
                title="Tu identidad bancaria"
                description="Estos datos salen del backend, no solo de Clerk."
              />
              <div className="identity-card">
                <div className="identity-card__avatar">
                  {`${overview.persona.nombre?.[0] || ''}${overview.persona.apellido?.[0] || ''}` || 'BA'}
                </div>
                <div className="identity-card__content">
                  <strong>
                    {overview.persona.nombre} {overview.persona.apellido}
                  </strong>
                  <span>{overview.persona.email || 'Email no informado'}</span>
                  <span>DNI: {overview.persona.dni || 'Pendiente'}</span>
                  <span>Teléfono: {overview.persona.telefono || 'Pendiente'}</span>
                </div>
              </div>
            </Panel>

            <OrbitalProductCard />
          </section>

          <OrbitalQuickActions
            onTransfer={() => router.push('/transferencias')}
            onAccounts={() => scrollToRef(accountsRef)}
            onCopyCbu={() => void copyPrimaryCbu()}
            onContacts={() => scrollToRef(accountsRef)}
            onActivity={() => scrollToRef(activityRef)}
            onAdmin={() => router.push('/admin')}
            showAdmin={canAccessAdmin}
          />

          <section ref={accountsRef}>
            <SectionTitle
              title="Tus cuentas"
              description="Visualizá saldo, alias y CBU de tus productos bancarios."
            />
            {overview.cuentas.length === 0 ? (
              <EmptyState
                title="Todavía no hay cuentas vinculadas"
                description="Cuando el backend tenga cuentas para tu persona, aparecerán acá."
              />
            ) : (
              <div className="orbital-card-grid">
                {overview.cuentas.map((cuenta) => (
                  <OrbitalAccountCard key={cuenta.id} account={cuenta} />
                ))}
              </div>
            )}
          </section>

          <section className="orbital-user-grid">
            <div ref={activityRef}>
              <OrbitalRecentActivity activities={overview.transacciones.slice(0, 8)} loading={loading} />
            </div>

            <Panel>
              <SectionTitle
                title="Destinatarios y catálogo"
                description="Resumen rápido de entidades auxiliares disponibles para esta cuenta."
              />
              <div className="mini-grid">
                <div className="mini-card">
                  <span>Destinatarios guardados</span>
                  <strong>{overview.destinatarios.length}</strong>
                </div>
                <div className="mini-card">
                  <span>Tipos de transacción</span>
                  <strong>{overview.tiposTransaccion.length}</strong>
                </div>
              </div>
              <div className="tag-row">
                {overview.tiposTransaccion.map((tipo) => (
                  <span key={tipo.id} className="soft-tag">
                    {tipo.nombre}
                  </span>
                ))}
              </div>
            </Panel>
          </section>
        </>
      ) : null}
    </BankShell>
  );
}
