import type { Transaccion } from "../../transacciones/types/transacciones.types";

export type Rubro = "luz" | "gas" | "agua" | "internet" | "telefonia" | "cable" | "otros";

export interface EmpresaServicio {
  id: string;
  nombre: string;
  rubro: Rubro;
  /** Pista para el formulario, por ejemplo "9 dígitos". */
  formato_numero_cliente: string;
}

/** El banco la expone con `monto`, aunque el proveedor la llame `importe`. */
export interface Factura {
  id: string;
  empresa_id: string;
  numero_cliente: string;
  periodo: string;
  monto: number;
  vencimiento: string;
  estado: "impaga" | "vencida" | "pagada";
}

export interface DeudaDeCliente {
  empresa: EmpresaServicio;
  numero_cliente: string;
  total_adeudado: number;
  /** Vacía si el cliente está al día: es un 200, no un 404. */
  facturas: Factura[];
}

export interface ResultadoPagoServicio {
  transaccion: Transaccion;
  factura: Factura;
  comprobante: string;
  fecha_pago: string;
}

export interface Operadora {
  id: string;
  nombre: string;
  /** Únicos montos aceptados: se ofrecen como opciones, no como campo libre. */
  montos_disponibles: number[];
}

export interface ResultadoRecarga {
  transaccion: Transaccion;
  recarga: {
    id: string;
    operadora: string;
    numero: string;
    monto: number;
    estado: "acreditada";
    fecha: string;
  };
}
