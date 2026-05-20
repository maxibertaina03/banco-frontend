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

export function getPersonaTransactionsById(personaId: string) {
  return request<TransactionRecord[]>(`/personas/${personaId}/transacciones`);
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
  cbuOrigen: string;
  cbuDestino: string;
  importe: number;
  saldoOrigen: number;
}) {
  return request<TransactionRecord>("/transacciones", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ResolvedRecipient {
  alias: string | null;
  cbu: string | null;
  titular: string | null;
  banco: string | null;
}

export function resolveRecipient(params: { alias?: string; cbu?: string }) {
  const query = params.alias
    ? `alias=${encodeURIComponent(params.alias)}`
    : `cbu=${encodeURIComponent(params.cbu ?? "")}`;
  return request<ResolvedRecipient>(`/transacciones/destinatario/resolver?${query}`);
}

export interface SyncIncomingResult {
  processed: number;
  synced: number;
  already_recorded: number;
  errors: number;
}

export function syncIncomingTransactions() {
  return request<SyncIncomingResult>("/transacciones/sync-incoming", { method: "POST" });
}
