export interface Tarjeta {
  id: string;
  persona_id: string;
  tipo: "debito" | "credito";
  /** Sólo los últimos 4 dígitos: el número completo no se expone nunca. */
  numero_enmascarado: string;
  cuenta_id: string | null;
  limite: number | null;
  disponible: number | null;
  estado: "activa" | "bloqueada" | "vencida";
  /** `MM/YY`, como se imprime en el plástico. */
  vencimiento: string | null;
  created_at: string;
}

export interface Autorizacion {
  id: string;
  tarjeta_id: string;
  comercio: string;
  monto: number;
  cuotas: number;
  estado: "aprobada" | "rechazada";
  motivo_rechazo: string | null;
  created_at: string;
}

export interface ResumenTarjeta {
  periodo: string;
  vencimiento: string;
  total_a_pagar: number;
  pago_minimo: number;
  consumos: Autorizacion[];
}
