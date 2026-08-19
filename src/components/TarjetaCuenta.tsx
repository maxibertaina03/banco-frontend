import { CheckCircle, Eye, EyeOff, RefreshCw, TrendingUp, XCircle } from 'lucide-react';
import { memo, useState } from 'react';

interface TarjetaCuentaProps {
  tipo: string;
  saldo: string;
  cbu?: string;
  alias?: string | null;
  moneda?: string;
  activa?: boolean;
  bancoCentralRegistrada?: boolean;
  syncing?: boolean;
  onSync?: () => void;
}

export const TarjetaCuenta = memo(function TarjetaCuenta({
  tipo,
  saldo,
  cbu,
  alias,
  moneda = 'ARS',
  activa = true,
  bancoCentralRegistrada,
  syncing = false,
  onSync,
}: TarjetaCuentaProps) {
  const [showBalance, setShowBalance] = useState(true);

  const formatSaldo = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2
    }).format(num);
  };

  const syncKnown = bancoCentralRegistrada !== undefined;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C0B2E] via-[#2D1548] to-[#3D2060] p-6 border border-primary/20 hover:border-primary/40 transition-all">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />

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

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#A855F7]/20 text-[#C084FC] text-sm">
              <TrendingUp className="w-3 h-3" />
              <span>{activa ? 'Activa' : 'Suspendida'}</span>
            </div>

            {syncKnown && (
              bancoCentralRegistrada ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-400/15 text-emerald-400 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  <span>Habilitada</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-400/15 text-amber-400 text-xs">
                  <XCircle className="w-3 h-3" />
                  <span>Pendiente</span>
                </div>
              )
            )}
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

        {onSync && !bancoCentralRegistrada && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-300 transition hover:bg-amber-400/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Habilitando...' : 'Habilitar para transferencias interbancarias'}
          </button>
        )}
      </div>
    </div>
  );
});
