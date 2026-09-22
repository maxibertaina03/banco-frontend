// canvas-confetti no trae tipos y @types/canvas-confetti no está instalado:
// alcanza con declarar lo poco que usamos.
declare module "canvas-confetti" {
  interface Opciones {
    particleCount?: number;
    spread?: number;
    startVelocity?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    scalar?: number;
    ticks?: number;
    disableForReducedMotion?: boolean;
  }
  export default function confetti(opciones?: Opciones): Promise<null> | null;
}
