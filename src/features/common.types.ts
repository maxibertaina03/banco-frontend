// Formas que comparten varios módulos del contrato v1.

export type Moneda = "ARS" | "USD";

/** Listado paginado. Ojo: `count` es lo que hay en ESTA página, no el total. */
export interface Paginado<T> {
  page: number;
  limit: number;
  count: number;
  data: T[];
}
