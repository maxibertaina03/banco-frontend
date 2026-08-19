import type { RolDePortal } from "../features/personas/types/personas.types";

export type Section = "dashboard" | "cuentas" | "transacciones" | "destinatarios" | "admin";

export const roleLabels: Record<RolDePortal, string> = {
  admin: "Admin",
  auditor: "Auditor",
  cliente: "Cliente",
  operador: "Operador",
  tesoreria: "Tesoreria",
};

export function getSectionItems(scope: "user" | "admin") {
  return [
    { key: "dashboard" as const, label: "Resumen" },
    { key: "cuentas" as const, label: "Cuentas" },
    { key: "transacciones" as const, label: "Movimientos" },
    { key: "destinatarios" as const, label: "Destinatarios" },
    ...(scope === "admin" ? [{ key: "admin" as const, label: "Admin" }] : []),
  ];
}
