import { memo } from "react";
import type { PortalRole } from "../../features/personas/types/personas.types";

interface PortalHeroProps {
  activeRole: PortalRole;
  onRoleChange: (role: PortalRole) => void;
  roleLabels: Record<PortalRole, string>;
  roleOptions: PortalRole[];
}

export const PortalHero = memo(function PortalHero({
  activeRole,
  onRoleChange,
  roleLabels,
  roleOptions,
}: PortalHeroProps) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#A855F7] via-[#9333EA] to-[#7C3AED] p-8 text-white shadow-2xl">
      <p className="text-sm uppercase tracking-[0.24em] text-white/80">Banco Orbital</p>
      <h1 className="mt-3">Tu banca digital conectada al backend real</h1>
      <p className="mt-3 max-w-2xl text-white/85">
        Mantiene la identidad visual púrpura de Orbital y unifica cliente, operador y admin dentro de una sola app por roles.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {roleOptions.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => onRoleChange(role)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              role === activeRole
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
