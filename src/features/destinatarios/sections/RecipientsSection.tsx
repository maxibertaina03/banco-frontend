import { memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import type { PersonaFullResponse, RecipientRecord } from "../../../lib/api";
import { recipientSchema, type RecipientFormValues } from "../../../lib/schemas";

// Mantenido para retrocompatibilidad con consumidores que aún lo importan
// (usePortalForms.ts antes lo usaba). Se quitará al final de la migración.
export interface RecipientFormState {
  alias: string;
  cbu: string;
  banco: string;
}

interface RecipientsSectionProps {
  onDelete: (recipient: RecipientRecord) => void;
  onSubmit: (values: RecipientFormValues) => Promise<void> | void;
  profile: PersonaFullResponse;
  submitting: boolean;
  // Permite que el padre indique "el último submit fue exitoso" para resetear el form.
  resetSignal?: number;
}

export const RecipientsSection = memo(function RecipientsSection({
  onDelete,
  onSubmit,
  profile,
  submitting,
  resetSignal,
}: RecipientsSectionProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<RecipientFormValues>({
    resolver: zodResolver(recipientSchema),
    mode: "onTouched",
    defaultValues: { alias: "", cbu: "", banco: "" },
  });

  // Reset cuando el padre lo solicita (tras submit OK).
  useEffect(() => {
    if (resetSignal === undefined) return;
    reset({ alias: "", cbu: "", banco: "" });
  }, [resetSignal, reset]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
        <CardHeader>
          <CardTitle>Nuevo destinatario</CardTitle>
          <CardDescription>Sumá un contacto a tu agenda para transferir más rápido.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-1">
              <Input
                {...register("alias")}
                placeholder="Alias"
                aria-invalid={errors.alias ? "true" : "false"}
              />
              {errors.alias && (
                <span className="text-xs text-destructive">{errors.alias.message}</span>
              )}
            </div>

            <div className="grid gap-1">
              <Input
                {...register("cbu")}
                placeholder="CBU (22 dígitos)"
                inputMode="numeric"
                aria-invalid={errors.cbu ? "true" : "false"}
              />
              {errors.cbu && (
                <span className="text-xs text-destructive">{errors.cbu.message}</span>
              )}
            </div>

            <div className="grid gap-1">
              <Input
                {...register("banco")}
                placeholder="Banco del destinatario"
                aria-invalid={errors.banco ? "true" : "false"}
              />
              {errors.banco && (
                <span className="text-xs text-destructive">{errors.banco.message}</span>
              )}
            </div>

            <Button type="submit" disabled={submitting || !isValid}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                "Agregar destinatario"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
        <CardHeader>
          <CardTitle>Agenda de contactos</CardTitle>
          <CardDescription>Tus destinatarios guardados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alias</TableHead>
                <TableHead>CBU</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profile.destinatarios.map((recipient) => (
                <TableRow key={recipient.id}>
                  <TableCell>{recipient.alias || "Sin alias"}</TableCell>
                  <TableCell>{recipient.cbu_externo}</TableCell>
                  <TableCell>{recipient.banco_externo || "No informado"}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      type="button"
                      onClick={() => onDelete(recipient)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
});
