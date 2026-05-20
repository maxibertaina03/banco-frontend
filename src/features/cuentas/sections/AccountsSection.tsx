import { AccountCard } from "../../../components/AccountCard";
import { UpdateAliasForm } from "../../../components/UpdateAliasForm";
import type { PersonaFullResponse } from "../../../lib/api";

interface AccountsSectionProps {
  onAliasEdit: (cbu: string) => void;
  onAliasUpdated: () => void;
  profile: PersonaFullResponse;
  selectedAccountForAlias: string | null;
}

export function AccountsSection({
  onAliasEdit,
  onAliasUpdated,
  profile,
  selectedAccountForAlias,
}: AccountsSectionProps) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {profile.cuentas.map((account) => (
          <AccountCard
            key={account.id}
            tipo={account.tipo_cuenta_nombre || "Cuenta bancaria"}
            saldo={String(account.saldo || 0)}
            cbu={account.cbu}
            alias={`Cuenta ${account.numero_cuenta.slice(-4)}`}
            activa={account.activa}
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
}
