export interface Cuenta {
  id: string;
  persona_id: string;
  tipo_cuenta_id: string;
  numero_cuenta: string;
  cbu: string;
  saldo: number;
  activa: boolean;
  tipo_cuenta_nombre?: string;
  banco_central_registrada?: boolean;
  alias?: string | null;
}

export interface TipoCuentaRecord {
  id: string;
  nombre: string;
  descripcion?: string | null;
  limite_transferencia?: number | null;
}
