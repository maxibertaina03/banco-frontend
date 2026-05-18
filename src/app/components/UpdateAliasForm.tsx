import { useState } from 'react';
import { Tag } from 'lucide-react';
import { updateAlias } from '../../features/cuentas/api/cuentas.api';

interface UpdateAliasFormProps {
  cbu: string;
  currentAlias?: string | null;
  onSuccess?: (newAlias: string) => void;
}

export function UpdateAliasForm({ cbu, currentAlias, onSuccess }: UpdateAliasFormProps) {
  const [alias, setAlias] = useState(currentAlias || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!alias.trim()) {
      setError('El alias no puede estar vacío.');
      return;
    }

    const aliasRegex = /^[a-zA-Z0-9.]+$/;
    if (!aliasRegex.test(alias.trim())) {
      setError('El alias solo puede contener letras, números, puntos y guiones.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateAlias(cbu, alias.trim());
      setSuccess(true);
      onSuccess?.(alias.trim());
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el alias.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] p-6">
      <div className="mb-4">
        <h3 className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-[#C084FC]" />
          Asignar o cambiar alias
        </h3>
        <p className="text-sm text-muted-foreground">
          El alias debe ser único globalmente. Solo letras, números, puntos y guiones.
        </p>
      </div>

      <div className="mb-4 rounded-2xl border border-primary/10 bg-[#2D1548]/40 p-4 text-sm">
        <p className="text-muted-foreground">CBU</p>
        <p className="font-mono text-xs">{cbu}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="juan.perez.banco"
          className="w-full rounded-xl border border-primary/20 bg-[#2D1548]/50 px-4 py-3 outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !alias.trim()}
          className="w-full rounded-xl bg-gradient-to-r from-[#A855F7] to-[#7C3AED] px-4 py-3 text-white disabled:opacity-60"
        >
          {loading ? 'Actualizando...' : 'Actualizar alias'}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      )}

      {success && (
        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
          <p className="text-sm text-emerald-300">✓ Alias actualizado exitosamente</p>
        </div>
      )}
    </div>
  );
}
