// La bandeja del gerente: los préstamos que esperan una decisión.
//
// Un préstamo llega acá cuando no pasó el filtro automático de la Central de
// Deudores, o cuando el Banco Central no respondió. El cliente todavía no
// recibió un peso.

import { request } from "../../../lib/api/client";

export interface SolicitudPendiente {
  id: string;
  persona_id: string;
  cuenta_id: string;
  moneda: string;
  capital: number;
  cuotas: number;
  tna: number | null;
  cuota_mensual: number;
  total_a_pagar: number;
  estado: string;
  created_at: string;
  /** La situación en la Central al momento de pedir. `null` si no se pudo consultar. */
  situacion_al_solicitar: number | null;
  solicitante: {
    nombre: string;
    apellido: string;
    dni: string | null;
    email: string | null;
  };
}

interface Respuesta {
  count: number;
  data: SolicitudPendiente[];
}

export function listarSolicitudesPendientes() {
  return request<Respuesta>("/prestamos/pendientes");
}

/** El motivo es obligatorio: queda en la auditoría con quién decidió. */
export function resolverSolicitud(prestamoId: string, aprobar: boolean, motivo: string) {
  return request(`/prestamos/${prestamoId}/${aprobar ? "aprobacion" : "rechazo"}`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
}
