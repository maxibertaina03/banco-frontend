import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { Section } from "../../pages/portal.config";

interface PortalTabsProps {
  items: Array<{ key: Section; label: string }>;
  onSectionChange: (section: Section) => void;
  section: Section;
}

/**
 * En el celular, una sola fila que se desliza con el dedo: con diez secciones,
 * envueltas en varias filas ocupaban media pantalla. Desde tablet vuelven a
 * envolverse, porque ahí entran. La pestaña activa se desplaza sola a la vista.
 *
 * Las dos sombras de los costados no son decoración. En un teléfono de 390px
 * entran cuatro de las nueve secciones y la fila se cortaba al ras del borde,
 * sin nada que dijera que había más: medido, 390px visibles de 938px. La
 * sombra aparece del lado en el que queda contenido y desaparece al llegar al
 * final, que es la única forma de que no mienta.
 */
export const PortalTabs = memo(function PortalTabs({ items, onSectionChange, section }: PortalTabsProps) {
  const activa = useRef<HTMLButtonElement>(null);
  const fila = useRef<HTMLElement>(null);
  const [hayMas, setHayMas] = useState({ izquierda: false, derecha: false });

  const medir = useCallback(() => {
    const el = fila.current;
    if (!el) return;
    const resto = el.scrollWidth - el.clientWidth - el.scrollLeft;
    setHayMas({ izquierda: el.scrollLeft > 4, derecha: resto > 4 });
  }, []);

  useEffect(() => {
    activa.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [section]);

  useEffect(() => {
    medir();
    const el = fila.current;
    if (!el) return;
    // Al cambiar de rol cambian las secciones, y con el teclado abierto o al
    // girar el teléfono cambia el ancho: en los dos casos hay que volver a medir.
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    window.addEventListener("resize", medir);
    return () => {
      observador.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, [medir, items.length]);

  return (
    // `relative` para colgarle las sombras, y los negativos para que la fila
    // llegue al borde de la pantalla y se note que sigue.
    <div className="relative -mx-4 mb-6 sm:mx-0 sm:mb-8">
      <nav
        ref={fila}
        onScroll={medir}
        aria-label="Secciones"
        className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:flex-wrap sm:gap-3 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <button
            key={item.key}
            ref={section === item.key ? activa : undefined}
            type="button"
            aria-current={section === item.key ? "page" : undefined}
            onClick={() => onSectionChange(item.key)}
            // 44px de alto en el teléfono: es el mínimo que se toca sin errarle.
            // Antes medían 36 y había que apuntar.
            className={`flex shrink-0 items-center whitespace-nowrap rounded-full px-4 py-2 text-sm transition dedo:min-h-11 dedo:py-0 ${
              section === item.key ? "bg-primary text-primary-foreground" : "bg-[#1C0B2E] hover:bg-[#2D1548]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Sólo en el teléfono: desde `sm` las secciones se envuelven y entran todas. */}
      {hayMas.izquierda && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0A0118] to-transparent sm:hidden" />
      )}
      {hayMas.derecha && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0A0118] to-transparent sm:hidden" />
      )}
    </div>
  );
});
