import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { editProfileSchema, type EditProfileFormValues } from "../lib/schemas";
import { useUpdateProfile } from "../lib/queries";
import { ApiError } from "../lib/api/client";
import type { AuthenticatedUserProfile } from "../features/personas/types/personas.types";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: AuthenticatedUserProfile | null;
  personaId: string | null | undefined;
}

export function EditProfileDialog({ open, onOpenChange, profile, personaId }: EditProfileDialogProps) {
  const updateMutation = useUpdateProfile(personaId);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    mode: "onTouched",
    defaultValues: {
      nombre: profile?.nombre ?? "",
      apellido: profile?.apellido ?? "",
      telefono: profile?.telefono ?? "",
      email: profile?.email ?? "",
    },
  });

  // Resetear el form cuando se abre o cambia el perfil.
  useEffect(() => {
    if (open) {
      reset({
        nombre: profile?.nombre ?? "",
        apellido: profile?.apellido ?? "",
        telefono: profile?.telefono ?? "",
        email: profile?.email ?? "",
      });
      setFeedback(null);
    }
  }, [open, profile, reset]);

  async function onSubmit(values: EditProfileFormValues) {
    setFeedback(null);
    // Solo enviar los campos que efectivamente cambiaron.
    const payload: Partial<EditProfileFormValues> = {};
    if (values.nombre && values.nombre !== profile?.nombre) payload.nombre = values.nombre;
    if (values.apellido && values.apellido !== profile?.apellido) payload.apellido = values.apellido;
    if (values.telefono && values.telefono !== profile?.telefono) payload.telefono = values.telefono;
    if (values.email && values.email !== profile?.email) payload.email = values.email;

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
