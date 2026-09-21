// Marco común del ingreso y el registro: la marca a la izquierda y el
// formulario de Clerk a la derecha. En pantallas chicas se apila.

import type { ReactNode } from "react";
import { ArrowLeftRight, Landmark, Wallet } from "lucide-react";
import logo from "../../imports/image-3.png";
import { IsotipoOrbital } from "../../components/marca/IsotipoOrbital";

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
    </div>
  );
}

/**
 * Anillos concéntricos de fondo, con el isotipo girando en uno. Es decoración:
 * `aria-hidden` y la animación se apaga si el sistema pide menos movimiento.
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
      {/* En el celular queda pegado al logo y se ve repetido: sólo en pantallas grandes. */}
      <div
        className="absolute left-[-8rem] top-1/2 hidden h-[50rem] w-[50rem] -translate-y-1/2 motion-safe:animate-[spin_60s_linear_infinite] lg:block"
      >
        <IsotipoOrbital size={36} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 opacity-80" />
      </div>
    </div>
  );
}
