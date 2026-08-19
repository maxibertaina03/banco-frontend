import { Building2, RefreshCcw, ShieldCheck } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { memo } from "react";
import type { OpcionDePersona } from "../../features/personas/types/personas.types";

interface PortalToolbarProps {
  loading: boolean;
  manualPersonaId: string;
  onLoadPersona: (personaId?: string) => void;
  onManualPersonaChange: (value: string) => void;
  personas: OpcionDePersona[];
  scope: "user" | "admin";
  selectedPersonaId: string;
  submitting: boolean;
}

export const PortalToolbar = memo(function PortalToolbar({
  loading,
  manualPersonaId,
  onLoadPersona,
  onManualPersonaChange,
  personas,
  scope,
  selectedPersonaId,
  submitting,
}: PortalToolbarProps) {
  return (
    <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_auto_auto]">
      <div className="rounded-2xl border border-primary/20 bg-[#1C0B2E] p-4">
        <p className="text-sm text-muted-foreground">Persona activa</p>
        {personas.length > 0 ? (
          <select
            value={selectedPersonaId}
            onChange={(event) => onLoadPersona(event.target.value)}
            className="mt-3 h-11 w-full rounded-xl border border-primary/20 bg-[#2D1548]/60 px-4 text-sm outline-none"
          >
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.nombre} {persona.apellido} - {persona.email}
              </option>
            ))}
          </select>
        ) : (
          <Input
            value={manualPersonaId}
            onChange={(event) => onManualPersonaChange(event.target.value)}
            placeholder="Pega un persona_id para cargar /personas/:id/full"
            className="mt-3"
          />
        )}
      </div>

      <Button onClick={() => onLoadPersona(manualPersonaId || selectedPersonaId || undefined)} disabled={loading || submitting}>
        <RefreshCcw className="mr-2 h-4 w-4" />
        Recargar
      </Button>

      <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-[#1C0B2E] px-4">
        {scope === "admin" ? <ShieldCheck className="h-4 w-4 text-primary" /> : <Building2 className="h-4 w-4 text-primary" />}
        <span className="text-sm">{scope === "admin" ? "Panel administrativo" : "Portal cliente"}</span>
      </div>
    </section>
  );
});
