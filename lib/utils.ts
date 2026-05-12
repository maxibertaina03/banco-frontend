export function formatCurrency(value: number | string) {
  const amount = typeof value === 'number' ? value : Number(value || 0);

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value?: string | null) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getInitials(first?: string | null, last?: string | null) {
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'BA';
}

export function getRoleLabel(roleNames: string[]) {
  if (roleNames.some((role) => ['admin', 'operador', 'auditor', 'tesoreria'].includes(role))) {
    return 'Equipo interno';
  }

  return 'Cliente';
}
