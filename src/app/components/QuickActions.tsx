import { ArrowUpRight, ArrowDownLeft, Repeat, QrCode, Phone, Zap } from 'lucide-react';

interface QuickActionsProps {
  onTransfer?: () => void;
  onIncome?: () => void;
  onAccounts?: () => void;
  onCopyCbu?: () => void;
  onContacts?: () => void;
  onActivity?: () => void;
}

export function QuickActions({
  onTransfer,
  onIncome,
  onAccounts,
  onCopyCbu,
  onContacts,
  onActivity,
}: QuickActionsProps) {
  const actions = [
    { icon: ArrowUpRight, label: 'Transferir', color: 'from-[#A855F7] to-[#9333EA]', onClick: onTransfer },
    { icon: ArrowDownLeft, label: 'Recargar', color: 'from-[#9333EA] to-[#7C3AED]', onClick: onIncome },
    { icon: Repeat, label: 'Cuentas', color: 'from-[#A855F7] to-[#7C3AED]', onClick: onAccounts },
    { icon: QrCode, label: 'CBU', color: 'from-[#7C3AED] to-[#A855F7]', onClick: onCopyCbu },
    { icon: Phone, label: 'Contactos', color: 'from-[#9333EA] to-[#A855F7]', onClick: onContacts },
    { icon: Zap, label: 'Movimientos', color: 'from-[#7C3AED] to-[#9333EA]', onClick: onActivity },
  ];

  return (
    <div className="bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] rounded-2xl p-6 border border-primary/20">
      <h3 className="mb-4">Acciones rápidas</h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#2D1548]/70 transition-all group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-center">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
