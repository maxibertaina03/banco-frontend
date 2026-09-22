import { ArrowUpRight, CreditCard, DollarSign, Landmark, PiggyBank, Receipt, Users, Wallet } from "lucide-react";
import { memo } from "react";
import type { Section } from "../pages/portal.config";

interface QuickActionsProps {
  onIr: (section: Section) => void;
}

// Los accesos del dashboard son atajos a las secciones, no acciones propias:
// así no hay dos caminos distintos que hagan lo mismo de maneras distintas.
const ACCIONES: Array<{ seccion: Section; label: string; icon: typeof ArrowUpRight; color: string }> = [
  { seccion: "transacciones", label: "Transferir", icon: ArrowUpRight, color: "from-[#A855F7] to-[#9333EA]" },
  { seccion: "pagos", label: "Pagos", icon: Receipt, color: "from-[#9333EA] to-[#7C3AED]" },
  { seccion: "cambio", label: "Dólares", icon: DollarSign, color: "from-[#7C3AED] to-[#A855F7]" },
  { seccion: "tarjetas", label: "Tarjetas", icon: CreditCard, color: "from-[#A855F7] to-[#7C3AED]" },
  { seccion: "prestamos", label: "Préstamos", icon: Landmark, color: "from-[#9333EA] to-[#A855F7]" },
  { seccion: "inversiones", label: "Inversiones", icon: PiggyBank, color: "from-[#7C3AED] to-[#9333EA]" },
  { seccion: "cuentas", label: "Cuentas", icon: Wallet, color: "from-[#A855F7] to-[#9333EA]" },
  { seccion: "destinatarios", label: "Contactos", icon: Users, color: "from-[#9333EA] to-[#7C3AED]" },
];

export const QuickActions = memo(function QuickActions({ onIr }: QuickActionsProps) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] p-4 sm:p-6">
      <h3 className="mb-4">Acciones rápidas</h3>
      {/* En el celular, sin relleno lateral en los botones: con cuatro columnas,
          el ícono y "Inversiones" no entraban y se salían del botón. */}
      <div className="grid grid-cols-4 gap-1 sm:gap-4 md:grid-cols-8">
        {ACCIONES.map((accion) => (
          <button
            key={accion.seccion}
            type="button"
            onClick={() => onIr(accion.seccion)}
            className="group flex flex-col items-center gap-2 rounded-xl px-0.5 py-2 transition-all hover:bg-[#2D1548]/70 sm:p-3"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accion.color} transition-transform group-hover:scale-110 sm:h-12 sm:w-12`}>
              <accion.icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            <span className="text-center text-[11px] leading-tight sm:text-xs">{accion.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
