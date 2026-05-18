import type { FormEvent } from "react";
import { RecentActivity } from "../../../app/components/RecentActivity";
import { Button } from "../../../app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../app/components/ui/card";
import { Input } from "../../../app/components/ui/input";
import { Textarea } from "../../../app/components/ui/textarea";
import type {
  PersonaFullResponse,
  TipoTransaccionRecord,
  UserActivity,
} from "../../../lib/api";

export interface TransferFormState {
  tipoTransaccionId: string;
  cuentaOrigenId: string;
  cuentaDestinoId: string;
  monto: string;
  descripcion: string;
}

interface TransactionsSectionProps {
  activities: UserActivity[];
  loading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTransferFormChange: (next: TransferFormState) => void;
  profile: PersonaFullResponse;
  submitting: boolean;
  transactionTypes: TipoTransaccionRecord[];
  transferForm: TransferFormState;
}

export function TransactionsSection({
  activities,
  loading,
  onSubmit,
  onTransferFormChange,
  profile,
  submitting,
  transactionTypes,
  transferForm,
}: TransactionsSectionProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
        <CardHeader>
          <CardTitle>Registrar operación</CardTitle>
          <CardDescription>Usa `POST /api/transacciones/operar`.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onSubmit}>
            {transactionTypes.length > 0 ? (
              <select
                value={transferForm.tipoTransaccionId}
                onChange={(event) =>
                  onTransferFormChange({ ...transferForm, tipoTransaccionId: event.target.value })
                }
                className="h-11 rounded-xl border border-primary/20 bg-[#2D1548]/60 px-4 text-sm outline-none"
              >
                {transactionTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                value={transferForm.tipoTransaccionId}
                onChange={(event) =>
                  onTransferFormChange({ ...transferForm, tipoTransaccionId: event.target.value })
                }
                placeholder="tipo_transaccion_id"
              />
            )}
            <select
              value={transferForm.cuentaOrigenId}
              onChange={(event) =>
                onTransferFormChange({ ...transferForm, cuentaOrigenId: event.target.value })
              }
              className="h-11 rounded-xl border border-primary/20 bg-[#2D1548]/60 px-4 text-sm outline-none"
            >
              {profile.cuentas.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.tipo_cuenta_nombre || "Cuenta"} - {account.numero_cuenta}
                </option>
              ))}
            </select>
            <Input
              value={transferForm.cuentaDestinoId}
              onChange={(event) =>
                onTransferFormChange({ ...transferForm, cuentaDestinoId: event.target.value })
              }
              placeholder="cuenta_destino_id"
            />
            <Input
              value={transferForm.monto}
              onChange={(event) => onTransferFormChange({ ...transferForm, monto: event.target.value })}
              placeholder="Monto"
            />
            <Textarea
              value={transferForm.descripcion}
              onChange={(event) =>
                onTransferFormChange({ ...transferForm, descripcion: event.target.value })
              }
              placeholder="Descripcion"
            />
            <Button type="submit" disabled={submitting}>
              Registrar
            </Button>
          </form>
        </CardContent>
      </Card>

      <RecentActivity activities={activities} loading={loading} />
    </div>
  );
}
