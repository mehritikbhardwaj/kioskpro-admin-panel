import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@kioskpro2026';
const SESSION_COOKIE = 'kioskpro_admin_session';

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function createAdminSessionToken(): string {
  // A deterministic token for the active session secret
  const secret = process.env.ADMIN_SECRET_KEY || 'kioskpro_super_secret_session_key_2026';
  return Buffer.from(`${secret}_${Date.now()}`).toString('base64');
}

export function isAuthenticated(): boolean {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    return Boolean(session?.value && session.value.length > 10);
  } catch {
    return false;
  }
}

export { SESSION_COOKIE };
