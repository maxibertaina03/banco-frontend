export interface Transaccion {
  id: string;
  tipo_transaccion_id: string;
  cuenta_origen_id?: string | null;
  cuenta_destino_id?: string | null;
  cuenta_origen_numero?: string | null;
  cuenta_destino_numero?: string | null;
  cbu_origen?: string | null;
  cbu_destino?: string | null;
  canal?: "local" | "interbancaria_saliente" | "interbancaria_entrante" | null;
  monto: number;
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

export interface ActividadDeUsuario {
  id: string;
  type: "in" | "out" | "transferencia" | "service";
  title: string;
  destinatario: string;
  amount: string;
  date: string;
  time: string;
}
