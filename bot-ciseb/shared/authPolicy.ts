export const INSTITUTIONAL_EMAIL_DOMAINS = [
  'escola.seduc.pa.gov.br',
  'seduc.pa.gov.br',
] as const;

export function isInstitutionalEmail(value: string): boolean {
  const email = value.trim().toLowerCase();
  const match = email.match(/^[^@\s]+@([^@\s]+)$/);
  if (!match) return false;
  return (INSTITUTIONAL_EMAIL_DOMAINS as readonly string[]).includes(match[1]);
}
