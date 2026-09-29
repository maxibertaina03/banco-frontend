export type NivelTarjeta = "standard" | "gold" | "platinum" | "black";

/** Un nivel del catálogo, con lo que hace falta para pedirlo. */
export interface NivelOfrecido {
  nivel: NivelTarjeta;
  nombre: string;
  limite: number;
  beneficios: string[];
  requisitos: { situacion_maxima: number; patrimonio_minimo: number };
  disponible: boolean;
  /** Qué le falta al cliente, cuando el nivel no está a su alcance. */
  motivo: string | null;
}

export interface OfertaDeNiveles {
  /** 1 a 5 en la Central de Deudores; `null` si no se pudo consultar. */
  situacion: number | null;
  patrimonio: number;
  cotizacion_usada: number | null;
  nivel_maximo: NivelTarjeta | null;
  niveles: NivelOfrecido[];
}

export interface Tarjeta {
  id: string;
  persona_id: string;
  tipo: "debito" | "credito";
  /** Sólo los últimos 4 dígitos: el número completo no se expone nunca. */
  numero_enmascarado: string;
  cuenta_id: string | null;
  limite: number | null;
  disponible: number | null;
  /** Sólo en crédito: el nivel define el límite y los beneficios. */
  nivel: NivelTarjeta | null;
  nivel_nombre: string | null;
  beneficios: string[] | null;
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
