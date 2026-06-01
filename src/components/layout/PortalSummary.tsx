import { memo } from "react";

interface PortalSummaryProps {
  activeAccountsCount: number;
  totalBalanceLabel: string;
}

export const PortalSummary = memo(function PortalSummary({
  activeAccountsCount,
  totalBalanceLabel,
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
      </div>
    </div>
  );
});
