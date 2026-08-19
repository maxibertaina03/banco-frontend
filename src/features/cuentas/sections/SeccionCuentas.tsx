import { memo } from "react";
import { RefreshCw } from "lucide-react";
import { TarjetaCuenta } from "../../../components/TarjetaCuenta";
import { UpdateAliasForm } from "../../../components/UpdateAliasForm";
import type { PersonaCompleta } from "../../../lib/api";

interface SeccionCuentasProps {
  onAliasEdit: (cbu: string) => void;
  onAliasUpdated: () => void;
  perfil: PersonaCompleta;
  cuentaSeleccionadaParaAlias: string | null;
  onSincronizarCuenta?: (idCuenta: string) => void;
  onBulkSync?: () => void;
  idCuentaSincronizando?: string | null;
  bulkSyncing?: boolean;
}

export const SeccionCuentas = memo(function SeccionCuentas({
  onAliasEdit,
  onAliasUpdated,
  perfil,
  cuentaSeleccionadaParaAlias,
  onSincronizarCuenta,
  onBulkSync,
  idCuentaSincronizando,
  bulkSyncing = false,
}: SeccionCuentasProps) {
  const unsynced = perfil.cuentas.filter((cuenta) => !cuenta.banco_central_registrada);

  return (
    <div className="grid gap-6">
      {onBulkSync && unsynced.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-400/20 bg-amber-400/5 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-amber-300">
              {unsynced.length} {unsynced.length === 1 ? "cuenta sin habilitar" : "cuentas sin habilitar"} para transferencias interbancarias
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Las cuentas habilitadas pueden enviar y recibir transferencias a otros bancos.
            </p>
          </div>
          <button
            onClick={onBulkSync}
            disabled={bulkSyncing}
            className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/15 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-400/25 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${bulkSyncing ? "animate-spin" : ""}`} />
            {bulkSyncing ? "Habilitando..." : "Habilitar todas"}
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {perfil.cuentas.map((cuenta) => (
          <TarjetaCuenta
            key={cuenta.id}
            tipo={cuenta.tipo_cuenta_nombre || "Cuenta bancaria"}
            saldo={String(cuenta.saldo || 0)}
            cbu={cuenta.cbu}
            alias={cuenta.alias || undefined}
            activa={cuenta.activa}
            bancoCentralRegistrada={cuenta.banco_central_registrada}
            syncing={idCuentaSincronizando === cuenta.id}
            onSync={onSincronizarCuenta ? () => onSincronizarCuenta(cuenta.id) : undefined}
          />
        ))}
      </div>

      {cuentaSeleccionadaParaAlias && (
        <UpdateAliasForm cbu={cuentaSeleccionadaParaAlias} onSuccess={onAliasUpdated} />
      )}

      {!cuentaSeleccionadaParaAlias && perfil.cuentas.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] p-6">
          <h3 className="mb-4 text-lg font-semibold">Actualizar alias de cuenta</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Selecciona una cuenta para asignarle o cambiarle su alias
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {perfil.cuentas.map((cuenta) => (
              <button
                key={cuenta.id}
                type="button"
                onClick={() => onAliasEdit(cuenta.cbu)}
                className="rounded-xl border border-primary/20 bg-[#2D1548]/50 px-4 py-3 text-left transition hover:bg-[#2D1548]/70"
              >
                <p className="font-mono text-sm">{cuenta.cbu}</p>
                <p className="text-xs text-muted-foreground">{cuenta.tipo_cuenta_nombre || "Cuenta"}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
