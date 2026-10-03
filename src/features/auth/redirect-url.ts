export function rutaInternaSegura(destino: string | null) {
  if (!destino?.startsWith("/") || destino.startsWith("//") || destino.includes("\\")) return "/";
  try {
    const url = new URL(destino, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}
