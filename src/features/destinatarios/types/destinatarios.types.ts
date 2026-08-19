export interface Destinatario {
  id: string;
  persona_id: string;
  alias?: string | null;
  cbu_externo: string;
  banco_externo?: string | null;
  created_at?: string;
}
