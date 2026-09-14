export type CanalTransaccion =
  | "local"
  | "interbancaria_saliente"
  | "interbancaria_entrante"
  | "deposito_efectivo"
  | "extraccion_efectivo"
  | "cambio_divisa"
  | "prestamo_acreditado"
  | "cuota_prestamo"
  | "plazo_fijo_constitucion"
  | "plazo_fijo_acreditacion"
  | "consumo_tarjeta"
  | "pago_servicio"
  | "recarga_celular";

export interface Transaccion {
  id: string;
  tipo_transaccion_id: string;
  cuenta_origen_id?: string | null;
  cuenta_destino_id?: string | null;
  cuenta_origen_numero?: string | null;
  cuenta_destino_numero?: string | null;
  cbu_origen?: string | null;
  cbu_destino?: string | null;
  canal?: CanalTransaccion | null;
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
