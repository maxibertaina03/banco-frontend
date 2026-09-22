import { memo, useEffect, useRef } from "react";
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
 */
export const PortalTabs = memo(function PortalTabs({ items, onSectionChange, section }: PortalTabsProps) {
  const activa = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activa.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [section]);

  return (
    <nav
      aria-label="Secciones"
      className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:mb-8 sm:flex-wrap sm:gap-3 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => (
        <button
          key={item.key}
          ref={section === item.key ? activa : undefined}
          type="button"
          aria-current={section === item.key ? "page" : undefined}
          onClick={() => onSectionChange(item.key)}
          className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
            section === item.key ? "bg-primary text-primary-foreground" : "bg-[#1C0B2E] hover:bg-[#2D1548]"
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
});
