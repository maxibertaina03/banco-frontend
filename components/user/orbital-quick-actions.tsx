'use client';

type OrbitalQuickActionsProps = {
  onTransfer?: () => void;
  onAccounts?: () => void;
  onCopyCbu?: () => void;
  onContacts?: () => void;
  onActivity?: () => void;
  onAdmin?: () => void;
  showAdmin?: boolean;
};

export function OrbitalQuickActions({
  onTransfer,
  onAccounts,
  onCopyCbu,
  onContacts,
  onActivity,
  onAdmin,
  showAdmin = false,
}: OrbitalQuickActionsProps) {
  const actions = [
    { icon: 'Tx', label: 'Transferir', onClick: onTransfer },
    { icon: 'Mv', label: 'Movimientos', onClick: onActivity },
    { icon: 'Ct', label: 'Cuentas', onClick: onAccounts },
    { icon: 'CB', label: 'Copiar CBU', onClick: onCopyCbu },
    { icon: 'Co', label: 'Contactos', onClick: onContacts },
    ...(showAdmin ? [{ icon: 'Ad', label: 'Modo admin', onClick: onAdmin }] : []),
  ];

  return (
    <div className="orbital-actions-card">
      <h3>Acciones rápidas</h3>
      <div className="orbital-actions-grid">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="orbital-action-tile"
          >
            <div className="orbital-action-tile__icon">{action.icon}</div>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
