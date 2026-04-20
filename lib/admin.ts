export const SUPER_ADMIN_EMAIL = "stclogic@gmail.com";

export function isSuperAdmin(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}
