'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import type { Cuenta } from '@/types/banking';

type OrbitalAccountCardProps = {
  account: Cuenta;
};

export function OrbitalAccountCard({ account }: OrbitalAccountCardProps) {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="orbital-account-card">
      <div className="orbital-account-card__glow" />
      <div className="orbital-account-card__content">
        <div className="orbital-account-card__head">
          <div>
            <p className="orbital-account-card__label">
              {account.tipo_cuenta_nombre || 'Cuenta bancaria'}
            </p>
            <div className="orbital-account-card__balance-row">
              <p className="orbital-account-card__balance">
                {showBalance ? formatCurrency(account.saldo) : '••••••'}
              </p>
              <button
                type="button"
                onClick={() => setShowBalance((current) => !current)}
                className="orbital-icon-button"
              >
                {showBalance ? <span>Oc</span> : <span>Ve</span>}
              </button>
            </div>
          </div>

          <div className="orbital-badge">
            <span>+</span>
            <span>{account.activa ? 'Activa' : 'Suspendida'}</span>
          </div>
        </div>

        <div className="orbital-account-card__meta">
          <div>
            <p className="orbital-account-card__meta-label">Alias</p>
            <p className="orbital-account-card__meta-value">{account.alias || 'Sin alias'}</p>
          </div>
          <div>
            <p className="orbital-account-card__meta-label">CBU</p>
            <p className="orbital-account-card__meta-value orbital-mono">{account.cbu}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
