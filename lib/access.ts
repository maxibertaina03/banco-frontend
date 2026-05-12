export function hasInternalRole(roleNames: string[]) {
  return roleNames.some((role) => ['admin', 'operador', 'auditor', 'tesoreria'].includes(role));
}
