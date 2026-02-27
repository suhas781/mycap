/**
 * Shared validation for auth (signup / login).
 * Signup: @mycaptain.id only. Login: @mycaptain.id or @mycaptain.in (backwards compat).
 */

export const SIGNUP_EMAIL_DOMAIN = '@mycaptain.id';
const LOGIN_EMAIL_DOMAINS = ['@mycaptain.id', '@mycaptain.in'];

const MIN_PASSWORD_LENGTH = 6;

/**
 * Validate email domain for signup (must be @mycaptain.id).
 */
export function isValidSignupEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return normalized.endsWith(SIGNUP_EMAIL_DOMAIN);
}

/**
 * Validate email domain for login (@mycaptain.id or @mycaptain.in).
 */
export function isValidLoginEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return LOGIN_EMAIL_DOMAINS.some((d) => normalized.endsWith(d));
}

/**
 * Normalize email: trim, lowercase.
 */
export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * Validate signup payload. Returns { valid: boolean, error?: string }.
 */
export function validateSignup({ name, email, password, confirm_password }) {
  const n = String(name || '').trim();
  if (!n) return { valid: false, error: 'Name is required.' };

  const e = normalizeEmail(email);
  if (!e) return { valid: false, error: 'Email is required.' };
  if (!isValidSignupEmail(e)) return { valid: false, error: 'Email must end with @mycaptain.id' };

  if (!password) return { valid: false, error: 'Password is required.' };
  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: 'Password must be at least 6 characters.' };
  }
  if (password !== confirm_password) {
    return { valid: false, error: 'Password and confirm password do not match.' };
  }
  return { valid: true };
}
