import { memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  completarPerfilSchema,
  type FormularioCompletarPerfil,
} from "../../../lib/schemas";
import type { PerfilUsuarioAutenticado } from "../types/personas.types";

interface SeccionCompletarPerfilProps {
  perfilAutenticado: PerfilUsuarioAutenticado | null;
  submitting: boolean;
  onSubmit: (values: FormularioCompletarPerfil) => Promise<void> | void;
}

function buildDefaults(perfilAutenticado: PerfilUsuarioAutenticado | null): FormularioCompletarPerfil {
  return {
    nombre: perfilAutenticado?.nombre || "",
    apellido: perfilAutenticado?.apellido || "",
    dni: perfilAutenticado?.dni || "",
    email: perfilAutenticado?.email || "",
    telefono: perfilAutenticado?.telefono || "",
    fechaNacimiento: perfilAutenticado?.fecha_nacimiento || "",
  };
}

export const SeccionCompletarPerfil = memo(function SeccionCompletarPerfil({
  perfilAutenticado,
  submitting,
  onSubmit,
}: SeccionCompletarPerfilProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormularioCompletarPerfil>({
    resolver: zodResolver(completarPerfilSchema),
    mode: "onTouched",
    defaultValues: buildDefaults(perfilAutenticado),
  });

  // Cuando `perfilAutenticado` llega tarde (auth query resuelve después del render
  // inicial), rellenamos los defaults sin sobrescribir cambios del usuario:
  // si el form sigue pristine (sin tocar), reseteamos a los nuevos valores.
  useEffect(() => {
    reset(buildDefaults(perfilAutenticado));
  }, [perfilAutenticado, reset]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
      <CardHeader className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle>Completá tu perfil para continuar</CardTitle>
        <CardDescription>
          Necesitamos algunos datos adicionales para terminar el alta de tu cuenta.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-1">
            <Label htmlFor="completar-perfil-nombre">Nombre</Label>
            <Input
              id="completar-perfil-nombre"
              {...register("nombre")}
              placeholder="Nombre"
              aria-invalid={errors.nombre ? "true" : "false"}
            />
            {errors.nombre && (
              <span className="text-xs text-destructive">{errors.nombre.message}</span>
            )}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="completar-perfil-apellido">Apellido</Label>
            <Input
              id="completar-perfil-apellido"
              {...register("apellido")}
              placeholder="Apellido"
              aria-invalid={errors.apellido ? "true" : "false"}
            />
            {errors.apellido && (
              <span className="text-xs text-destructive">{errors.apellido.message}</span>
            )}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="completar-perfil-dni">DNI</Label>
            <Input
              id="completar-perfil-dni"
              {...register("dni")}
              placeholder="DNI"
              inputMode="numeric"
              aria-invalid={errors.dni ? "true" : "false"}
            />
            {errors.dni && (
              <span className="text-xs text-destructive">{errors.dni.message}</span>
            )}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="completar-perfil-email">Email</Label>
            <Input
              id="completar-perfil-email"
              type="email"
              {...register("email")}
              placeholder="Email"
              aria-invalid={errors.email ? "true" : "false"}
            />
            {errors.email && (
              <span className="text-xs text-destructive">{errors.email.message}</span>
            )}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="completar-perfil-telefono">Teléfono</Label>
            <Input
              id="completar-perfil-telefono"
              {...register("telefono")}
              placeholder="Teléfono"
              aria-invalid={errors.telefono ? "true" : "false"}
            />
            {errors.telefono && (
              <span className="text-xs text-destructive">{errors.telefono.message}</span>
            )}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="completar-perfil-fecha-nacimiento">Fecha de nacimiento</Label>
            <Input
              id="completar-perfil-fecha-nacimiento"
              type="date"
              {...register("fechaNacimiento")}
              aria-invalid={errors.fechaNacimiento ? "true" : "false"}
            />
            {errors.fechaNacimiento && (
              <span className="text-xs text-destructive">{errors.fechaNacimiento.message}</span>
            )}
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-3 rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-muted-foreground">
            <p>Al guardar, tu cuenta queda lista para operar.</p>
            <Button type="submit" disabled={submitting || !isValid}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar y continuar"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});
