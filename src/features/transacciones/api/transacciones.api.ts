import { request } from "../../../lib/api/client";
import type { AccountRecord } from "../../cuentas/types/cuentas.types";
import type {
  TipoTransaccionRecord,
  TransactionRecord,
  UserActivity,
} from "../types/transacciones.types";

export type {
  TipoTransaccionRecord,
  TransactionRecord,
  UserActivity,
} from "../types/transacciones.types";

interface ListResponse<T> {
  data: T[];
}

export async function listTiposTransaccion() {
  const response = await request<ListResponse<TipoTransaccionRecord>>("/tipos-transaccion?limit=50");
  return response.data;
}

export function getAccountTransactions(accountId: string) {
  return request<TransactionRecord[]>(`/cuentas/${accountId}/transacciones`);
}

export async function getPersonaTransactions(accounts: AccountRecord[]) {
  const transactionGroups = await Promise.all(accounts.map((account) => getAccountTransactions(account.id)));
  const uniqueTransactions = new Map<string, TransactionRecord>();

  for (const group of transactionGroups) {
    for (const transaction of group) {
      uniqueTransactions.set(transaction.id, transaction);
    }
  }

  return Array.from(uniqueTransactions.values()).sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );
}

export function createTransfer(payload: {
  tipo_transaccion_id: string;
  cuenta_origen_id: string;
  cuenta_destino_id?: string | null;
  monto: number;
  descripcion?: string | null;
  estado?: "pendiente" | "completada" | "rechazada";
}) {
  return request<TransactionRecord>("/transacciones/operar", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
