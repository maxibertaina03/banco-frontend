export interface TransactionRecord {
  id: string;
  tipo_transaccion_id: string;
  cuenta_origen_id: string;
  cuenta_destino_id?: string | null;
  cuenta_origen_numero?: string;
  cuenta_destino_numero?: string | null;
  monto: string | number;
  descripcion?: string | null;
  estado: "pendiente" | "completada" | "rechazada";
  created_at: string;
  tipo_transaccion_nombre?: string;
}

export interface TipoTransaccionRecord {
  id: string;
  nombre: string;
  descripcion?: string | null;
}

export interface UserActivity {
  id: string;
  type: "in" | "out" | "transfer" | "service";
  title: string;
  recipient: string;
  amount: string;
  date: string;
  time: string;
}
