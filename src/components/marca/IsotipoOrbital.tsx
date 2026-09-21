// El isotipo de Orbital: el anillo con el punto, que en el logo hace de "O".
//
// En SVG y no el PNG del logo para que escale nítido a cualquier tamaño y se
// pueda usar solo, sin el resto de la palabra. Los colores salen del logo.

interface IsotipoOrbitalProps {
  size?: number;
  className?: string;
}

// Circunferencia de r=22: 2π·22 ≈ 138.2. El arco oscuro cubre 5/8 del anillo,
// desde las 12 en sentido horario, como en el logo.
const CIRCUNFERENCIA = 138.2;
const ARCO = CIRCUNFERENCIA * 0.625;

export function IsotipoOrbital({ size = 40, className }: IsotipoOrbitalProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="Orbital">
      <circle cx="32" cy="32" r="22" fill="none" stroke="#C4B5FD" strokeWidth="10" />
      <circle
        cx="32"
        cy="32"
        r="22"
        fill="none"
        stroke="#8B5CF6"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${ARCO} ${CIRCUNFERENCIA}`}
        transform="rotate(-90 32 32)"
      />
      <circle cx="32" cy="32" r="7" fill="#C4B5FD" />
    </svg>
  );
}
