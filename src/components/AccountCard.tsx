import { Eye, EyeOff, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface AccountCardProps {
  tipo: string;
  saldo: string;
  cbu?: string;
  alias?: string;
  moneda?: string;
  activa?: boolean;
}

export function AccountCard({ tipo, saldo, cbu, alias, moneda = 'ARS', activa = true }: AccountCardProps) {
  const [showBalance, setShowBalance] = useState(true);

  const formatSaldo = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2
    }).format(num);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C0B2E] via-[#2D1548] to-[#3D2060] p-6 border border-primary/20 hover:border-primary/40 transition-all">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{tipo}</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl">
                {showBalance ? formatSaldo(saldo) : '••••••'}
              </p>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1.5 rounded-lg hover:bg-[#A855F7]/30 transition-colors"
              >
                {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#A855F7]/20 text-[#C084FC] text-sm">
            <TrendingUp className="w-3 h-3" />
            <span>{activa ? 'Activa' : 'Suspendida'}</span>
          </div>
        </div>

        {alias && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Alias</p>
            <p className="text-sm font-mono">{alias}</p>
          </div>
        )}

        {cbu && (
          <div className="space-y-1 mt-2">
            <p className="text-xs text-muted-foreground">CBU</p>
            <p className="text-xs font-mono tracking-wider">{cbu}</p>
          </div>
        )}
      </div>
    </div>
  );
}
