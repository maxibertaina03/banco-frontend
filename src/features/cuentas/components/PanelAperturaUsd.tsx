import { DollarSign } from "lucide-react";
import { useState } from "react";
import { Aviso, Boton, Campo, Entrada, mensajeDeError } from "../../../components/operaciones/ui";
import { useAbrirCuenta } from "../../../lib/queries";

/**
 * Apertura de la caja de ahorro en dólares. Sólo se muestra si la persona
 * todavía no tiene una. El Banco Central asigna el CBU; si la persona tiene
 * situación crediticia 3 o peor, el backend responde 403 y se muestra el motivo.
 */
export function PanelAperturaUsd({ personaId }: { personaId: string }) {
  const [alias, setAlias] = useState("");
  const abrir = useAbrirCuenta(personaId);

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-emerald-400/15 p-2 text-emerald-300">
          <DollarSign className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium">Abrí tu caja de ahorro en dólares</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Sin costo. Tiene su propio CBU y te permite comprar y vender dólares al instante.
          </p>

          <form
            className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              abrir.mutate({ moneda: "USD", alias: alias.trim() || null });
            }}
          >
            <Campo label="Alias (opcional)" hint="Si lo dejás vacío, se genera uno a partir de tu nombre.">
              <Entrada value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="juan.perez.usd" maxLength={20} />
            </Campo>
            <Boton type="submit" cargando={abrir.isPending} className="sm:mb-5">
              Abrir caja en USD
            </Boton>
          </form>

          {abrir.isError && <Aviso tipo="error">{mensajeDeError(abrir.error)}</Aviso>}
        </div>
      </div>
    </div>
  );
}
