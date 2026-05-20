import { memo } from "react";
import { RefreshCw } from "lucide-react";
import { AccountCard } from "../../../components/AccountCard";
import { UpdateAliasForm } from "../../../components/UpdateAliasForm";
import type { PersonaFullResponse } from "../../../lib/api";

interface AccountsSectionProps {
  onAliasEdit: (cbu: string) => void;
  onAliasUpdated: () => void;
  profile: PersonaFullResponse;
  selectedAccountForAlias: string | null;
  onSyncAccount?: (accountId: string) => void;
  onBulkSync?: () => void;
  syncingAccountId?: string | null;
  bulkSyncing?: boolean;
}

export const AccountsSection = memo(function AccountsSection({
  onAliasEdit,
  onAliasUpdated,
  profile,
  selectedAccountForAlias,
  onSyncAccount,
  onBulkSync,
  syncingAccountId,
  bulkSyncing = false,
}: AccountsSectionProps) {
  const unsynced = profile.cuentas.filter((account) => !account.banco_central_registrada);

  return (
    <div className="grid gap-6">
      {onBulkSync && unsynced.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-400/20 bg-amber-400/5 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-amber-300">
              {unsynced.length} {unsynced.length === 1 ? "cuenta sin sincronizar" : "cuentas sin sincronizar"} con Brocoly
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Las cuentas sincronizadas pueden operar transferencias interbancarias reales.
            </p>
          </div>
          <button
            onClick={onBulkSync}
            disabled={bulkSyncing}
            className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/15 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-400/25 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${bulkSyncing ? "animate-spin" : ""}`} />
            {bulkSyncing ? "Sincronizando..." : "Sincronizar todas"}
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {profile.cuentas.map((account) => (
          <AccountCard
            key={account.id}
            tipo={account.tipo_cuenta_nombre || "Cuenta bancaria"}
            saldo={String(account.saldo || 0)}
            cbu={account.cbu}
            alias={account.alias || undefined}
            activa={account.activa}
            bancoCentralRegistrada={account.banco_central_registrada}
            syncing={syncingAccountId === account.id}
            onSync={onSyncAccount ? () => onSyncAccount(account.id) : undefined}
          />
        ))}
      </div>

      {selectedAccountForAlias && (
        <UpdateAliasForm cbu={selectedAccountForAlias} onSuccess={onAliasUpdated} />
      )}

      {!selectedAccountForAlias && profile.cuentas.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] p-6">
          <h3 className="mb-4 text-lg font-semibold">Actualizar alias de cuenta</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Selecciona una cuenta para asignarle o cambiarle su alias
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.cuentas.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => onAliasEdit(account.cbu)}
                className="rounded-xl border border-primary/20 bg-[#2D1548]/50 px-4 py-3 text-left transition hover:bg-[#2D1548]/70"
              >
                <p className="font-mono text-sm">{account.cbu}</p>
                <p className="text-xs text-muted-foreground">{account.tipo_cuenta_nombre || "Cuenta"}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
