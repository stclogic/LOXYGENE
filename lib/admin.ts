export const SUPER_ADMIN_EMAILS = [
  "stclogic@gmail.com",
  "zigglelink@gmail.com",
];

export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}
