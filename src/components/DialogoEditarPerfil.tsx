import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { editarPerfilSchema, type FormularioEditarPerfil } from "../lib/schemas";
import { useActualizarPerfil } from "../lib/queries";
import { ApiError } from "../lib/api/client";
import type { PerfilUsuarioAutenticado } from "../features/personas/types/personas.types";

interface DialogoEditarPerfilProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfil: PerfilUsuarioAutenticado | null;
  personaId: string | null | undefined;
}

/** 44673782 → 44.673.782, como figura en el documento. */
function formatearDni(dni: string) {
  return /^\d+$/.test(dni) ? Number(dni).toLocaleString("es-AR") : dni;
}

export function DialogoEditarPerfil({ open, onOpenChange, perfil, personaId }: DialogoEditarPerfilProps) {
  const updateMutation = useActualizarPerfil(personaId);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormularioEditarPerfil>({
    resolver: zodResolver(editarPerfilSchema),
    mode: "onTouched",
    defaultValues: {
      nombre: perfil?.nombre ?? "",
      apellido: perfil?.apellido ?? "",
      telefono: perfil?.telefono ?? "",
      email: perfil?.email ?? "",
    },
  });

  // Resetear el form cuando se abre o cambia el perfil.
  useEffect(() => {
    if (open) {
      reset({
        nombre: perfil?.nombre ?? "",
        apellido: perfil?.apellido ?? "",
        telefono: perfil?.telefono ?? "",
        email: perfil?.email ?? "",
      });
      setFeedback(null);
    }
  }, [open, perfil, reset]);

  async function onSubmit(values: FormularioEditarPerfil) {
    setFeedback(null);
    // Solo enviar los campos que efectivamente cambiaron.
    const payload: Partial<FormularioEditarPerfil> = {};
    if (values.nombre && values.nombre !== perfil?.nombre) payload.nombre = values.nombre;
    if (values.apellido && values.apellido !== perfil?.apellido) payload.apellido = values.apellido;
    if (values.telefono && values.telefono !== perfil?.telefono) payload.telefono = values.telefono;
    if (values.email && values.email !== perfil?.email) payload.email = values.email;

    if (Object.keys(payload).length === 0) {
      setFeedback({ kind: "error", text: "Modificá al menos un campo antes de guardar." });
      return;
    }

    try {
      await updateMutation.mutateAsync(payload);
      setFeedback({ kind: "success", text: "Tu información fue actualizada." });
      // Cerrar el modal después de un breve momento.
      setTimeout(() => onOpenChange(false), 1200);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "No se pudo actualizar el perfil.";
      setFeedback({ kind: "error", text: message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1C0B2E] border-primary/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mis datos</DialogTitle>
          <DialogDescription>Actualizá tu información personal.</DialogDescription>
        </DialogHeader>

        {/* Fuera del formulario: se muestra pero no se edita. Es la clave con la
            que el Banco Central identifica a la persona y va dentro del CBU, y
            el backend rechaza cambiarlo una vez completado el perfil. */}
        {perfil?.dni && (
          <div className="rounded-xl border border-primary/15 bg-[#2D1548]/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">DNI</p>
            <p className="mt-0.5 font-mono text-base tracking-wide">{formatearDni(perfil.dni)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No se puede modificar desde acá. Si tiene un error, comunicate con el banco.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2" noValidate>
          <div className="grid gap-1">
            <Label htmlFor="edit-nombre">Nombre</Label>
            <Input id="edit-nombre" {...register("nombre")} aria-invalid={errors.nombre ? "true" : "false"} />
            {errors.nombre && <span className="text-xs text-destructive">{errors.nombre.message}</span>}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="edit-apellido">Apellido</Label>
            <Input id="edit-apellido" {...register("apellido")} aria-invalid={errors.apellido ? "true" : "false"} />
            {errors.apellido && <span className="text-xs text-destructive">{errors.apellido.message}</span>}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="edit-telefono">Teléfono</Label>
            <Input id="edit-telefono" {...register("telefono")} aria-invalid={errors.telefono ? "true" : "false"} />
            {errors.telefono && <span className="text-xs text-destructive">{errors.telefono.message}</span>}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" {...register("email")} aria-invalid={errors.email ? "true" : "false"} />
            {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
          </div>

          {feedback && (
            <div
              className={`rounded-xl border px-3 py-2 text-xs ${
                feedback.kind === "success"
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              }`}
            >
              {feedback.text}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending || !isDirty}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
