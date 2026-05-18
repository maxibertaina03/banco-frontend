import type { PortalRole } from "../../features/personas/types/personas.types";

export type Section = "dashboard" | "accounts" | "transactions" | "recipients" | "admin";

export const roleLabels: Record<PortalRole, string> = {
  admin: "Admin",
  cliente: "Cliente",
  operador: "Operador",
};

export function getSectionItems(scope: "user" | "admin") {
  return [
    { key: "dashboard" as const, label: "Resumen" },
    { key: "accounts" as const, label: "Cuentas" },
    { key: "transactions" as const, label: "Movimientos" },
    { key: "recipients" as const, label: "Destinatarios" },
    ...(scope === "admin" ? [{ key: "admin" as const, label: "Admin" }] : []),
  ];
}
