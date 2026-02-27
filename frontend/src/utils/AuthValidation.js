/**
 * Shared auth form validation (signup / login).
 * Signup: email must end with @mycaptain.id; password min 6 chars; password === confirm_password.
 */

const SIGNUP_EMAIL_DOMAIN = '@mycaptain.id';
const MIN_PASSWORD_LENGTH = 6;

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

export function isValidSignupEmail(email) {
  return normalizeEmail(email).endsWith(SIGNUP_EMAIL_DOMAIN);
}

export function validateSignupFields({ name, email, password, confirm_password }) {
  const errors = {};
  const n = String(name ?? '').trim();
  if (!n) errors.name = 'Name is required';

  const e = normalizeEmail(email);
  if (!e) errors.email = 'Email is required';
  else if (!e.endsWith(SIGNUP_EMAIL_DOMAIN)) errors.email = 'Email must end with @mycaptain.id';

  if (!password) errors.password = 'Password is required';
  else if (password.length < MIN_PASSWORD_LENGTH) errors.password = 'Password must be at least 6 characters';

  if (password !== confirm_password) errors.confirm_password = 'Passwords do not match';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLoginFields({ email, password }) {
  const errors = {};
  if (!String(email ?? '').trim()) errors.email = 'Email is required';
  if (!password) errors.password = 'Password is required';
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
