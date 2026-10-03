import { useReverification } from "@clerk/clerk-react";
import { Scanner, type IScannerError } from "@yudiel/react-qr-scanner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, QrCode, ScanLine, Share2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { ApiError, nuevaClaveIdempotencia } from "../../../lib/api/client";
import { formatCurrency, parsearMonto } from "../../../lib/utils/currency";
import { consultarCobroQr, crearCobroQr, transferirCobroQr, type CobroQr } from "../api/cobros.api";

const DOMINIO_APP = (import.meta.env.VITE_APP_ORIGIN || "https://app.orbital.net.ar").replace(/\/$/, "");
const MONTO_MAXIMO_QR = 1_000_000;

function PanelQr({ children, titulo, bajada }: { children: React.ReactNode; titulo: string; bajada: string }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] px-4 py-6 text-white sm:py-10">
      <div className="mx-auto max-w-lg">
        <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm text-purple-200 hover:text-white">
          <ArrowLeft className="size-4" /> Volver al inicio
        </Link>
        <Card className="border-primary/20 bg-[#1C0B2E]/90 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">{titulo}</CardTitle>
            <p className="text-sm text-purple-200">{bajada}</p>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}

function mensajeError(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "No se pudo completar la operación. Intentá de nuevo.";
}

function formatearCuentaRegresiva(segundos: number) {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
}

export function CobrarPage() {
  const [textoMonto, setTextoMonto] = useState("");
  const [monto, setMonto] = useState<number | null>(null);
  const [cobroId, setCobroId] = useState<string | null>(null);
  const [expiraAt, setExpiraAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const linkQr = useMemo(() => {
    if (!cobroId) return "";
    const url = new URL("/pagar", DOMINIO_APP);
    url.searchParams.set("id", cobroId);
    return url.toString();
  }, [cobroId]);

  useEffect(() => {
    if (!expiraAt) return;
    const actualizar = () => {
      const restante = Math.max(0, Math.ceil((new Date(expiraAt).getTime() - Date.now()) / 1000));
      setSegundos(restante);
    };
    actualizar();
    const timer = window.setInterval(actualizar, 1000);
    return () => window.clearInterval(timer);
  }, [expiraAt]);

  const generar = async () => {
    const valor = parsearMonto(textoMonto);
    if (!valor || !Number.isFinite(valor)) {
      setError("Ingresá un monto mayor a cero, con hasta dos decimales.");
      return;
    }
    if (valor > MONTO_MAXIMO_QR) {
      setError(`El monto máximo para un cobro por QR es ${formatCurrency(MONTO_MAXIMO_QR)}.`);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const cobro = await crearCobroQr(valor);
      setMonto(Number(cobro.monto));
      setCobroId(cobro.id);
      setExpiraAt(cobro.expira_at);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  };

  const limpiar = () => {
    setCobroId(null);
    setExpiraAt(null);
    setMonto(null);
    setSegundos(0);
    setError(null);
  };

  const compartirODescargar = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      setError("No se pudo preparar la imagen del QR.");
      return;
    }
    const archivo = new File([blob], "orbital-cobro-qr.png", { type: "image/png" });
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [archivo] }))) {
      try {
        await navigator.share({ title: "Cobro por QR - Orbital", files: [archivo] });
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
    }
    const enlace = document.createElement("a");
    enlace.href = canvas.toDataURL("image/png");
    enlace.download = "orbital-cobro-qr.png";
    enlace.click();
  };

  return (
    <PanelQr titulo="Cobrar con QR" bajada="Generá un código temporal para recibir una transferencia.">
      {!cobroId || segundos === 0 ? (
        <div className="space-y-4">
          {cobroId && segundos === 0 && (
            <p role="status" className="rounded-lg bg-amber-500/15 p-3 text-sm text-amber-200">
              El QR venció. Generá uno nuevo para volver a cobrar.
            </p>
          )}
          <label htmlFor="monto-qr" className="block text-sm font-medium">Monto en pesos</label>
          <input
            id="monto-qr"
            type="number"
            min="0.01"
            max={MONTO_MAXIMO_QR}
            step="0.01"
            inputMode="decimal"
            autoComplete="off"
            value={textoMonto}
            onChange={(event) => setTextoMonto(event.target.value)}
            placeholder="0,00"
            className="h-12 w-full rounded-lg border border-primary/30 bg-[#2D1548] px-4 text-lg text-white outline-none focus:border-purple-400"
          />
          <p className="text-xs text-purple-200">Máximo {formatCurrency(MONTO_MAXIMO_QR)}.</p>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          <Button type="button" onClick={generar} disabled={enviando} className="h-12 w-full">
            <QrCode className="size-4" /> {enviando ? "Generando..." : "Generar QR"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-xl bg-white p-3">
            <QRCodeCanvas ref={canvasRef} value={linkQr} size={256} level="M" marginSize={4} title="QR de cobro Orbital" />
          </div>
          <p className="text-sm text-purple-200">Monto a cobrar</p>
          <p className="text-3xl font-semibold">{formatCurrency(monto || 0)}</p>
          <p className="inline-flex items-center gap-2 text-amber-200">
            <Clock3 className="size-4" /> Vence en {formatearCuentaRegresiva(segundos)}
          </p>
          <Button type="button" variant="outline" onClick={compartirODescargar} className="w-full">
            <Share2 className="size-4" /> Compartir / descargar QR
          </Button>
          <Button type="button" variant="secondary" onClick={limpiar} className="w-full">
            Generar nuevo QR
          </Button>
        </div>
      )}
    </PanelQr>
  );
}

export function EscanearPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [leyendo, setLeyendo] = useState(false);

  const alEscanear = useCallback((codigos: Array<{ rawValue: string }>) => {
    if (leyendo || !codigos[0]?.rawValue) return;
    setLeyendo(true);
    setError(null);
    try {
      const url = new URL(codigos[0].rawValue);
      const origen = new URL(DOMINIO_APP);
      const id = url.searchParams.get("id");
      if (
        url.protocol !== "https:" ||
        url.origin !== origen.origin ||
        url.pathname !== "/pagar" ||
        url.hash ||
        Array.from(url.searchParams.keys()).length !== 1 ||
        !id ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
      ) {
        setError("Este QR no es válido para transferencias");
        setLeyendo(false);
        return;
      }
      navigate(`/pagar?id=${encodeURIComponent(id)}`);
    } catch {
      setError("Este QR no es válido para transferencias");
      setLeyendo(false);
    }
  }, [leyendo, navigate]);

  const alFallar = useCallback((problema: IScannerError) => {
    if (problema.kind === "permission-denied" || problema.kind === "security") {
      setError("No diste permiso para usar la cámara. Habilitalo en la configuración del navegador para escanear.");
    } else if (problema.kind === "no-camera" || problema.kind === "unsupported") {
      setError("No hay una cámara disponible en este dispositivo.");
    } else if (problema.kind === "insecure-context") {
      setError("La cámara requiere una conexión segura HTTPS. Abrí Orbital desde su sitio seguro.");
    } else {
      setError("No se pudo iniciar la cámara. Revisá los permisos e intentá de nuevo.");
    }
  }, []);

  return (
    <PanelQr titulo="Escanear QR" bajada="Apuntá la cámara al QR de cobro de Orbital.">
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {leyendo ? (
        <p className="py-8 text-center text-purple-200">Consultando el cobro...</p>
      ) : (
        <div className="overflow-hidden rounded-xl">
          <Scanner
            constraints={{ facingMode: "environment" }}
            onScan={alEscanear}
            onError={alFallar}
            formats={["qr_code"]}
          />
        </div>
      )}
      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-purple-200">
        <ScanLine className="size-4" /> Solo se acepta un QR de pago de app.orbital.net.ar.
      </p>
    </PanelQr>
  );
}

export function PagarPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get("id");
  const [cobro, setCobro] = useState<CobroQr | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const claveRef = useRef(nuevaClaveIdempotencia());

  const pagarConReverificacion = useReverification(async (cobroId: string, key: string) => (
    transferirCobroQr(cobroId, key)
  ));

  useEffect(() => {
    let cancelado = false;
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      setError("Este QR no es válido para transferencias");
      setCargando(false);
      return;
    }
    consultarCobroQr(id)
      .then((resultado) => {
        if (!cancelado) setCobro(resultado);
      })
      .catch((e: unknown) => {
        if (!cancelado) {
          setError(e instanceof ApiError && e.status === 404
            ? "Este QR no es válido para transferencias"
            : mensajeError(e));
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => { cancelado = true; };
  }, [id]);

  const confirmar = async () => {
    if (!cobro || !id) return;
    setEnviando(true);
    setError(null);
    try {
      await pagarConReverificacion(id, claveRef.current);
      setExito(true);
    } catch (e) {
      setError(mensajeError(e));
      if (e instanceof ApiError && e.status === 422) {
        claveRef.current = nuevaClaveIdempotencia();
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PanelQr titulo={exito ? "Transferencia realizada" : "Confirmar transferencia"} bajada="Revisá los datos antes de confirmar.">
      {cargando ? (
        <p className="py-8 text-center text-purple-200">Consultando cobro...</p>
      ) : exito ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto size-14 text-emerald-400" />
          <p className="text-lg font-medium">El pago se realizó correctamente.</p>
          <Button type="button" onClick={() => navigate("/")} className="w-full">Volver al inicio</Button>
        </div>
      ) : error ? (
        <div className="space-y-4">
          <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-200">{error}</p>
          <Button type="button" variant="outline" onClick={() => navigate("/escanear")} className="w-full">Volver</Button>
        </div>
      ) : cobro ? (
        <div className="space-y-5">
          <div className="rounded-xl bg-[#2D1548] p-4">
            <p className="text-sm text-purple-200">Vas a transferir a</p>
            <p className="mt-1 text-lg font-semibold">{cobro.titular}</p>
            <p className="mt-3 text-sm text-purple-200">Monto</p>
            <p className="text-3xl font-semibold">{formatCurrency(Number(cobro.monto))}</p>
          </div>
          <p className="text-xs text-purple-200">Clerk puede pedirte verificar tu identidad antes de confirmar esta operación.</p>
          <Button type="button" onClick={confirmar} disabled={enviando} className="h-12 w-full">
            {enviando ? "Enviando..." : "Confirmar transferencia"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/escanear")} disabled={enviando} className="w-full">
            Cancelar
          </Button>
        </div>
      ) : null}
    </PanelQr>
  );
}
