import { memo } from "react";
import { Copy } from "lucide-react";

interface PortalSummaryProps {
  activeAccountsCount: number;
  totalBalanceLabel: string;
  cbu?: string | null;
  alias?: string | null;
  onCopyCbu?: () => void;
  onCopyAlias?: () => void;
}

export const PortalSummary = memo(function PortalSummary({
  activeAccountsCount,
  totalBalanceLabel,
  cbu,
  alias,
  onCopyCbu,
  onCopyAlias,
}: PortalSummaryProps) {
  return (
    <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] p-6">
      <p className="text-sm text-muted-foreground">Resumen</p>
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between rounded-2xl bg-[#2D1548]/60 p-4">
          <span>Saldo total</span>
          <span className="text-xl text-primary">{totalBalanceLabel}</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-[#2D1548]/60 p-4">
          <span>Cuentas activas</span>
          <span className="text-xl text-primary">{activeAccountsCount}</span>
        </div>

        {/* CBU del cliente logueado, con botón para copiarlo */}
        {cbu && (
          <div className="rounded-2xl bg-[#2D1548]/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <span>CBU</span>
              <button
                type="button"
                onClick={onCopyCbu}
                className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-[#1C0B2E]/60 px-2.5 py-1 text-xs text-primary transition hover:bg-[#1C0B2E]"
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </button>
            </div>
            <p className="mt-2 font-mono text-sm text-primary break-all">{cbu}</p>
          </div>
        )}

        {/* Alias del cliente logueado, con botón para copiarlo */}
        {cbu && (
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#2D1548]/60 p-4">
            <span>Alias</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary">{alias || "Sin alias"}</span>
              {alias && (
                <button
                  type="button"
                  onClick={onCopyAlias}
                  aria-label="Copiar alias"
                  className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-[#1C0B2E]/60 px-2.5 py-1 text-xs text-primary transition hover:bg-[#1C0B2E]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
