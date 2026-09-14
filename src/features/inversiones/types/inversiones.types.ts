import type { Moneda } from "../../common.types";

export interface SimulacionPlazoFijo {
  capital: number;
  dias: number;
  tna: number;
  interes: number;
  total: number;
  tea: number;
}

export interface PlazoFijo {
  id: string;
  persona_id: string;
  cuenta_id: string;
  moneda: Moneda;
  capital: number;
  dias: number;
  tna: number | null;
  interes: number;
  total: number;
  tea: number | null;
  fecha_constitucion: string;
  fecha_vencimiento: string;
  estado: "vigente" | "vencido" | "acreditado" | "cancelado_anticipado";
  fecha_acreditacion: string | null;
  total_acreditado: number | null;
  created_at: string;
}

export interface ResultadoAcreditacion {
  plazo_fijo: PlazoFijo;
  total_acreditado: number;
  dias_transcurridos: number;
  anticipada: boolean;
}
