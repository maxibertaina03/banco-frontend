import { memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  completeProfileSchema,
  type CompleteProfileFormValues,
} from "../../../lib/schemas";
import type { AuthenticatedUserProfile } from "../types/personas.types";

interface CompleteProfileSectionProps {
  authProfile: AuthenticatedUserProfile | null;
  submitting: boolean;
  onSubmit: (values: CompleteProfileFormValues) => Promise<void> | void;
}

function buildDefaults(authProfile: AuthenticatedUserProfile | null): CompleteProfileFormValues {
  return {
    nombre: authProfile?.nombre || "",
    apellido: authProfile?.apellido || "",
    dni: authProfile?.dni || "",
    email: authProfile?.email || "",
    telefono: authProfile?.telefono || "",
    fechaNacimiento: authProfile?.fecha_nacimiento || "",
  };
}

export const CompleteProfileSection = memo(function CompleteProfileSection({
  authProfile,
  submitting,
  onSubmit,
}: CompleteProfileSectionProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    mode: "onTouched",
    defaultValues: buildDefaults(authProfile),
  });

  // Cuando `authProfile` llega tarde (auth query resuelve después del render
  // inicial), rellenamos los defaults sin sobrescribir cambios del usuario:
  // si el form sigue pristine (sin tocar), reseteamos a los nuevos valores.
  useEffect(() => {
    reset(buildDefaults(authProfile));
  }, [authProfile, reset]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
      <CardHeader className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle>Completa tu perfil para continuar</CardTitle>
        <CardDescription>
          Terminamos el alta en Clerk, pero todavía faltan datos obligatorios en la base local de Orbital.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-1">
            <Label htmlFor="complete-profile-nombre">Nombre</Label>
            <Input
              id="complete-profile-nombre"
              {...register("nombre")}
              placeholder="Nombre"
              aria-invalid={errors.nombre ? "true" : "false"}
            />
            {errors.nombre && (
              <span className="text-xs text-destructive">{errors.nombre.message}</span>
            )}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="complete-profile-apellido">Apellido</Label>
            <Input
              id="complete-profile-apellido"
              {...register("apellido")}
              placeholder="Apellido"
              aria-invalid={errors.apellido ? "true" : "false"}
            />
            {errors.apellido && (
              <span className="text-xs text-destructive">{errors.apellido.message}</span>
            )}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="complete-profile-dni">DNI</Label>
            <Input
              id="complete-profile-dni"
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
            <Label htmlFor="complete-profile-email">Email</Label>
            <Input
              id="complete-profile-email"
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
            <Label htmlFor="complete-profile-telefono">Telefono</Label>
            <Input
              id="complete-profile-telefono"
              {...register("telefono")}
              placeholder="Telefono"
              aria-invalid={errors.telefono ? "true" : "false"}
            />
            {errors.telefono && (
              <span className="text-xs text-destructive">{errors.telefono.message}</span>
            )}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="complete-profile-fecha-nacimiento">Fecha de nacimiento</Label>
            <Input
              id="complete-profile-fecha-nacimiento"
              type="date"
              {...register("fechaNacimiento")}
              aria-invalid={errors.fechaNacimiento ? "true" : "false"}
            />
            {errors.fechaNacimiento && (
              <span className="text-xs text-destructive">{errors.fechaNacimiento.message}</span>
            )}
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-3 rounded-2xl bg-[#2D1548]/60 p-4 text-sm text-muted-foreground">
            <p>Cuando guardes, se marcará `perfil_completo = true` y el portal volverá a cargar tus datos.</p>
            <Button type="submit" disabled={submitting || !isValid}>
              Guardar y continuar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});
