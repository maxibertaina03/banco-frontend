import type { Moneda } from "../../common.types";

/** Fila del cronograma, sistema francés. `estado` sólo viene en préstamos otorgados. */
export interface CuotaPrestamo {
  numero: number;
  vencimiento: string;
  cuota: number;
  capital: number;
  interes: number;
  saldo: number;
  estado?: "pendiente" | "pagada" | "en_mora";
  fecha_pago?: string;
}

export interface SimulacionPrestamo {
  capital: number;
  cuotas: number;
  /** En porcentaje: 72 significa 72 %. */
  tna: number;
  tem: number;
  cuota_mensual: number;
  total_a_pagar: number;
  total_intereses: number;
  cft: number;
  cronograma: CuotaPrestamo[];
}

export interface Prestamo {
  id: string;
  persona_id: string;
  cuenta_id: string;
  moneda: Moneda;
  capital: number;
  cuotas: number;
  tna: number | null;
  tem: number | null;
  cuota_mensual: number;
  total_a_pagar: number;
  total_intereses: number;
  cft: number | null;
  saldo_deuda: number;
  estado: "vigente" | "cancelado" | "en_mora";
  fecha_otorgamiento: string;
  created_at: string;
  /** Sólo en el detalle, no en el listado. */
  cronograma?: CuotaPrestamo[];
}

export interface ResultadoPagoCuota {
  cuota: CuotaPrestamo;
  cuotas_pendientes: number;
  saldo_deuda: number;
  estado_prestamo: Prestamo["estado"];
}

export interface ResultadoPrecancelacion {
  prestamo: Prestamo;
  capital_pagado: number;
}
