import type { FormEvent } from "react";
import { Button } from "../../../app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../app/components/ui/card";
import { Input } from "../../../app/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../app/components/ui/table";
import type { PersonaFullResponse, RecipientRecord } from "../../../lib/api";

export interface RecipientFormState {
  alias: string;
  cbu: string;
  banco: string;
}

interface RecipientsSectionProps {
  onDelete: (recipient: RecipientRecord) => void;
  onRecipientFormChange: (next: RecipientFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  profile: PersonaFullResponse;
  recipientForm: RecipientFormState;
  submitting: boolean;
}

export function RecipientsSection({
  onDelete,
  onRecipientFormChange,
  onSubmit,
  profile,
  recipientForm,
  submitting,
}: RecipientsSectionProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
        <CardHeader>
          <CardTitle>Nuevo destinatario</CardTitle>
          <CardDescription>Alta sobre `destinatarios`.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <Input
              value={recipientForm.alias}
              onChange={(event) =>
                onRecipientFormChange({ ...recipientForm, alias: event.target.value })
              }
              placeholder="Alias"
            />
            <Input
              value={recipientForm.cbu}
              onChange={(event) =>
                onRecipientFormChange({ ...recipientForm, cbu: event.target.value })
              }
              placeholder="CBU externo"
            />
            <Input
              value={recipientForm.banco}
              onChange={(event) =>
                onRecipientFormChange({ ...recipientForm, banco: event.target.value })
              }
              placeholder="Banco externo"
            />
            <Button type="submit" disabled={submitting}>
              Agregar destinatario
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
        <CardHeader>
          <CardTitle>Agenda de confianza</CardTitle>
          <CardDescription>Destinatarios actuales de la persona seleccionada.</CardDescription>
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
}
