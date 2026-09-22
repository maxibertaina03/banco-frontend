// Marco común del ingreso y el registro: la marca a la izquierda y el
// formulario de Clerk a la derecha. En pantallas chicas se apila.

import { useState, type ReactNode } from "react";
import { ArrowLeftRight, Landmark, Wallet } from "lucide-react";
import logo from "../../imports/image-3.png";
import { IsotipoOrbital } from "../../components/marca/IsotipoOrbital";
import { DialogoOrbitaSecreta } from "../bonificaciones/DialogoOrbitaSecreta";
import { festejar, marcarPendiente } from "../bonificaciones/orbita-secreta";

const BENEFICIOS = [
  { icono: Wallet, texto: "Cuentas en pesos y en dólares" },
  { icono: ArrowLeftRight, texto: "Transferencias al instante, a cualquier banco" },
  { icono: Landmark, texto: "Préstamos y plazos fijos desde donde estés" },
];

interface LayoutAccesoProps {
  titulo: string;
  bajada: string;
  children: ReactNode;
}

export function LayoutAcceso({ titulo, bajada, children }: LayoutAccesoProps) {
  const [descubierta, setDescubierta] = useState(false);

  function descubrir() {
    marcarPendiente();
    festejar();
    setDescubierta(true);
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0A0118] text-white">
      <Orbitas />

      <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <section className="text-center lg:text-left">
          <img src={logo} alt="Orbital" className="mx-auto h-12 object-contain sm:h-16 lg:mx-0 lg:h-20" />

          <h1 className="mt-8 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {titulo}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-purple-200/80 sm:text-lg lg:mx-0">{bajada}</p>

          {/* Los beneficios ocupan lugar que en el celular le hace falta al formulario. */}
          <ul className="mt-10 hidden space-y-4 lg:block">
            {BENEFICIOS.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-purple-100">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-[#1C0B2E]">
                  <Icono className="h-5 w-5 text-[#C4B5FD]" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-md">{children}</section>
      </div>

      <footer className="relative pb-6 text-center text-xs text-purple-300/50">
        © {new Date().getFullYear()} Banco Orbital
      </footer>

      <OrbitaSecreta onDescubrir={descubrir} />
      <DialogoOrbitaSecreta estado={descubierta ? { tipo: "descubierta" } : null} onCerrar={() => setDescubierta(false)} />
    </div>
  );
}

/**
 * El isotipo que orbita, y que se puede tocar: la órbita secreta.
 *
 * Va en su propia capa, arriba del contenido: en la de fondo los clicks los
 * tapaba el contenido. Y se recorta a la mitad izquierda para que, al girar,
 * nunca pase por encima del formulario y se robe el click de "Continuar".
 * Sin foco de teclado: es un easter egg, no una función.
 */
function OrbitaSecreta({ onDescubrir }: { onDescubrir: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-1/2 overflow-hidden lg:block">
      <div className="absolute left-[-8rem] top-1/2 h-[50rem] w-[50rem] -translate-y-1/2 motion-safe:animate-[spin_60s_linear_infinite]">
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={onDescubrir}
          className="pointer-events-auto absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 opacity-80 transition hover:scale-125 hover:opacity-100 hover:drop-shadow-[0_0_14px_rgba(168,85,247,0.9)]"
        >
          <IsotipoOrbital size={36} />
        </button>
      </div>
    </div>
  );
}

/**
 * Anillos concéntricos de fondo. Es decoración: `aria-hidden`. El isotipo que
 * gira en uno de ellos vive aparte, en OrbitaSecreta, porque se puede tocar.
 * En el celular no está: quedaba pegado al logo y se veía repetido.
 */
function Orbitas() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -left-40 top-1/2 h-[46rem] w-[46rem] -translate-y-1/2 rounded-full bg-purple-700/20 blur-3xl" />
      {[34, 50, 66].map((tamano) => (
        <div
          key={tamano}
          className="absolute left-[-8rem] top-1/2 -translate-y-1/2 rounded-full border border-purple-400/10"
          style={{ width: `${tamano}rem`, height: `${tamano}rem` }}
        />
      ))}
    </div>
  );
}
