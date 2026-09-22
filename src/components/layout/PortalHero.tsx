import { memo } from "react";
import type { RolDePortal } from "../../features/personas/types/personas.types";

interface PortalHeroProps {
  rolActivo: RolDePortal;
  onRoleChange: (role: RolDePortal) => void;
  roleLabels: Record<RolDePortal, string>;
  roleOptions: RolDePortal[];
}

export const PortalHero = memo(function PortalHero({
  rolActivo,
  onRoleChange,
  roleLabels,
  roleOptions,
}: PortalHeroProps) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#A855F7] via-[#9333EA] to-[#7C3AED] p-5 text-white shadow-2xl sm:p-8">
      <p className="text-xs uppercase tracking-[0.24em] text-white/80 sm:text-sm">Banco Orbital</p>
      <h1 className="mt-2 text-xl leading-snug sm:mt-3 sm:text-2xl">Tu banca digital, simple y a un clic</h1>
      {/* En el celular se omite: empuja el contenido real una pantalla más abajo. */}
      <p className="mt-3 hidden max-w-2xl text-white/85 sm:block">
        Consultá tus cuentas, transferí dinero y administrá tus contactos desde un solo lugar.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
        {roleOptions.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => onRoleChange(role)}
            className={`rounded-full border px-4 py-1.5 text-sm transition sm:py-2 ${
              role === rolActivo
                ? "border-white bg-white text-[#6D28D9]"
                : "border-white/30 bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {roleLabels[role]}
          </button>
        ))}
      </div>
    </div>
  );
});
