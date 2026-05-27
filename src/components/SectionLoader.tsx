import { Card, CardContent } from "./ui/card";

// Fallback genérico para Suspense de sections lazy-loaded. Mantiene el
// layout del portal estable durante el code-split — el chunk típicamente
// llega en <100ms si está cacheado, así que evitamos un skeleton elaborado.
export function SectionLoader() {
  return (
    <Card className="border-primary/20 bg-[#1C0B2E]">
      <CardContent className="py-12 text-center text-sm text-muted-foreground">
        Cargando sección…
      </CardContent>
    </Card>
  );
}
