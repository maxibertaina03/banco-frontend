import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "../../components/ui/dialog";
import { IsotipoOrbital } from "../../components/marca/IsotipoOrbital";
import type { ResultadoBienvenida } from "./orbita-secreta";

export type EstadoOrbita =
  | { tipo: "descubierta" }
  | { tipo: "acreditada"; resultado: ResultadoBienvenida }
  | { tipo: "ya-cobrada" }
  | { tipo: "error"; mensaje: string };

function textos(estado: EstadoOrbita) {
  switch (estado.tipo) {
    case "descubierta":
      return {
        titulo: "¡Encontraste la órbita secreta!",
        cuerpo: (
          <>
            Por tu curiosidad te ganaste <strong className="text-white">US$ 5</strong> de bienvenida en tu caja de
            ahorro en dólares. Si todavía no la tenés, te la abrimos.
          </>
        ),
        nota: "Iniciá sesión o registrate y te los acreditamos automáticamente.",
        boton: "¡Buenísimo!",
      };
    case "acreditada":
      return {
        titulo: "¡Te acreditamos US$ 5!",
        cuerpo: estado.resultado.cuenta_abierta
          ? "Te abrimos tu caja de ahorro en dólares y ya tenés tu bonificación de bienvenida adentro."
          : "Tu bonificación de bienvenida ya está en tu caja de ahorro en dólares.",
        nota: `Caja en dólares N° ${estado.resultado.cuenta.numero_cuenta}`,
        boton: "¡Gracias!",
      };
    case "ya-cobrada":
      return {
        titulo: "Ya habías encontrado la órbita",
        cuerpo: "La bonificación de bienvenida se cobra una sola vez, y ya la tenés. ¡Gracias por la curiosidad!",
        nota: null,
        boton: "Entendido",
      };
    case "error":
      return {
        titulo: "No pudimos acreditarte la bonificación",
        cuerpo: estado.mensaje,
        nota: null,
        boton: "Entendido",
      };
  }
}

/** El premio de la órbita secreta: al descubrirla en el login y al cobrarla en el portal. */
export function DialogoOrbitaSecreta({ estado, onCerrar }: { estado: EstadoOrbita | null; onCerrar: () => void }) {
  if (!estado) return null;
  const t = textos(estado);
  const festivo = estado.tipo === "descubierta" || estado.tipo === "acreditada";

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent className="border-primary/30 bg-[#1C0B2E] text-center sm:max-w-sm">
        <div className="mx-auto mt-2 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#2D1548] to-[#1C0B2E] shadow-[0_0_40px_rgba(168,85,247,0.35)]">
          <IsotipoOrbital size={64} className={festivo ? "motion-safe:animate-[spin_6s_linear_infinite]" : ""} />
        </div>
        <DialogTitle className="mt-2 text-xl font-semibold">{t.titulo}</DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-purple-100/80">{t.cuerpo}</DialogDescription>
        {t.nota && <p className="text-xs text-muted-foreground">{t.nota}</p>}
        <DialogFooter className="mt-2 sm:justify-center">
          <Button type="button" className="w-full sm:w-auto sm:px-10" onClick={onCerrar}>
            {t.boton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
