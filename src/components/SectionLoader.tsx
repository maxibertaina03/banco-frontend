import { CargandoOrbital } from "./marca/CargandoOrbital";

// Fallback genérico para Suspense de sections lazy-loaded. Mantiene el
// layout del portal estable durante el code-split — el chunk típicamente
// llega en <100ms si está cacheado, así que no hace falta un skeleton
// elaborado, pero sí que se vea que el banco está trabajando.
export function SectionLoader() {
  return <CargandoOrbital variante="panel" mensaje="Cargando sección…" />;
}
