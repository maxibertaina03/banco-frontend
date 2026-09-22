import { useCallback, useEffect, useMemo, useState } from "react";
import type { Cuenta } from "../features/cuentas/types/cuentas.types";
import type { Transaccion } from "../features/transacciones/types/transacciones.types";
import { formatCurrency } from "../lib/utils/currency";

// Sistema de notificaciones bancarias.
//
// Diseño:
//   - No agregamos tabla en BD para mantener el alcance acotado.
//   - Filtramos las transacciones del usuario y nos quedamos con las
//     entrantes (canal interbancaria_entrante o destino propio).
//   - "Leídas" se guardan en localStorage por usuario para que persistan
//     entre recargas.
//   - El badge muestra el count de no leídas.
//
// Si más adelante se quiere un sistema más rico (push real, etc.) se puede
// agregar una tabla `notificaciones` y este hook pasa a leer de ahí.

export interface NotificationItem {
  id: string;
  title: string;
  amount: number;
  amountLabel: string;
  destinatario: string;
  date: string;
  isoDate: string;
  read: boolean;
  /** Llegó pero no se acreditó (monedas distintas): se muestra, pero sin "+". */
  rechazada: boolean;
}

const STORAGE_KEY_PREFIX = "orbital:notifications:read:";

function readStored(personaId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + personaId);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeStored(personaId: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY_PREFIX + personaId,
      JSON.stringify(Array.from(ids))
    );
  } catch {
    // localStorage lleno o no disponible — ignoramos silenciosamente.
  }
}

/** Qué fue el ingreso. Antes todo lo que no era un depósito decía "Transferencia recibida". */
function tituloDe(tx: Transaccion): string {
  if (tx.estado === "rechazada") return "Transferencia no acreditada";
  switch (tx.canal) {
    case "deposito_efectivo":
      return "Depósito acreditado";
    case "prestamo_acreditado":
      return "Préstamo acreditado";
    case "plazo_fijo_acreditacion":
      return "Plazo fijo acreditado";
    case "bonificacion":
      return "Bonificación acreditada";
    default:
      return "Transferencia recibida";
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHs / 24);

  if (diffMin < 1) return "Hace instantes";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHs < 24) return `Hace ${diffHs} h`;
  if (diffDays < 7) return `Hace ${diffDays} d`;
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(d);
}

interface UseNotificationsParams {
  personaId: string | null | undefined;
  transacciones: Transaccion[];
  cuentas: Cuenta[];
}

export function useNotifications({ personaId, transacciones, cuentas }: UseNotificationsParams) {
  const [readIds, setReadIds] = useState<Set<string>>(() =>
    personaId ? readStored(personaId) : new Set()
  );

  // Cuando cambia la persona activa, recargamos los IDs marcados como leídos
  // (el operador / admin puede saltar entre personas).
  useEffect(() => {
    if (!personaId) {
      setReadIds(new Set());
      return;
    }
    setReadIds(readStored(personaId));
  }, [personaId]);

  // Detectar transferencias entrantes a este usuario.
  const incoming = useMemo(() => {
    const idsCuenta = new Set(cuentas.map((a) => a.id));
    return transacciones
      .filter((tx) => {
        const isInterbankIncoming = tx.canal === "interbancaria_entrante";
        const isLocalIncoming =
          Boolean(tx.cuenta_destino_id) &&
          idsCuenta.has(tx.cuenta_destino_id as string) &&
          !idsCuenta.has(tx.cuenta_origen_id as string);
        return isInterbankIncoming || isLocalIncoming;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [transacciones, cuentas]);

  const notifications = useMemo<NotificationItem[]>(() => {
    // El movimiento no trae la moneda: es la de la cuenta que lo recibió. Sin
    // esto, una transferencia en dólares se mostraba como pesos.
    const monedaDeCuenta = new Map(cuentas.map((c) => [c.id, c.moneda ?? "ARS"]));

    return incoming.slice(0, 30).map((tx) => {
      const amount = Number(tx.monto || 0);
      const moneda = monedaDeCuenta.get(tx.cuenta_destino_id as string) ?? "ARS";
      const rechazada = tx.estado === "rechazada";
      const destinatario =
        tx.descripcion ||
        tx.cuenta_origen_numero ||
        (tx.cbu_origen ? `CBU ...${tx.cbu_origen.slice(-6)}` : "Transferencia recibida");
      return {
        id: tx.id,
        title: tituloDe(tx),
        amount,
        amountLabel: `${rechazada ? "" : "+"}${formatCurrency(Math.abs(amount), moneda)}`,
        destinatario,
        date: formatDate(tx.created_at),
        isoDate: tx.created_at,
        read: readIds.has(tx.id),
        rechazada,
      };
    });
  }, [incoming, readIds, cuentas]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(
    (id: string) => {
      if (!personaId) return;
      setReadIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        writeStored(personaId, next);
        return next;
      });
    },
    [personaId]
  );

  const markAllAsRead = useCallback(() => {
    if (!personaId) return;
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const n of notifications) next.add(n.id);
      writeStored(personaId, next);
      return next;
    });
  }, [personaId, notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
