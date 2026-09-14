import type { CanalTransaccion } from "./types/transacciones.types";

/** Texto para mostrar de cada canal, en el extracto y en el detalle. */
export const ETIQUETA_DE_CANAL: Record<CanalTransaccion, string> = {
  local: "Transferencia",
  interbancaria_saliente: "Transferencia a otro banco",
  interbancaria_entrante: "Transferencia recibida",
  deposito_efectivo: "Depósito en efectivo",
  extraccion_efectivo: "Extracción en efectivo",
  cambio_divisa: "Cambio de moneda",
  prestamo_acreditado: "Préstamo acreditado",
  cuota_prestamo: "Cuota de préstamo",
  plazo_fijo_constitucion: "Plazo fijo constituido",
  plazo_fijo_acreditacion: "Plazo fijo acreditado",
  consumo_tarjeta: "Consumo con tarjeta de débito",
  pago_servicio: "Pago de servicio",
  recarga_celular: "Recarga de celular",
};

export function etiquetaDeCanal(canal: string | null | undefined, respaldo = "Movimiento") {
  return (canal && ETIQUETA_DE_CANAL[canal as CanalTransaccion]) || respaldo;
}
