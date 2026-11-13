/**
 * security.js — input validation & session helpers
 *
 * Centralizes credential/username sanitization so the same rules
 * apply on login, registration, and admin account management.
 *
 * Rules:
 *  - Usernames / student numbers are validated against an allowlist
 *    (never "sanitized" by stripping characters — passwords in
 *    particular must be passed through untouched).
 *  - Passwords are validated by length only. bcrypt only reads the
 *    first 72 bytes, so we cap input at 72 characters to make
 *    truncation behaviour consistent.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt truncates after 72 bytes

/* Usernames for portal_users and student numbers share this shape:
   letters, digits, dot, dash, underscore — max 32 chars. */
const LOGIN_ID_PATTERN = /^[a-zA-Z0-9._-]{1,32}$/;

/* Student numbers (e.g. "2025-0617"): letters, digits, dash — max 20. */
const STUDENT_NUMBER_PATTERN = /^[a-zA-Z0-9-]{1,20}$/;

const NUMERIC_ID_PATTERN = /^\d+$/;

/**
 * Validates a login identifier (admin username OR student number).
 * Returns the trimmed value, or '' when it fails the allowlist.
 * Failing closed (empty string) prevents any malformed input from
 * ever reaching a query.
 */
export function sanitizeLoginInput(input) {
  if (typeof input !== 'string') return '';
  const v = input.trim();
  if (!LOGIN_ID_PATTERN.test(v)) return '';
  return v;
}

/**
 * Validates a student number for registration.
 * Returns the trimmed value, or '' when invalid.
 */
export function sanitizeStudentNumber(input) {
  if (typeof input !== 'string') return '';
  const v = input.trim();
  if (!STUDENT_NUMBER_PATTERN.test(v)) return '';
  return v;
}

/**
 * Login-time password check: required, max length only.
 * Deliberately does NOT strip any characters — mangling passwords
 * silently changes what the user typed and can weaken them.
 */
export function validatePasswordInput(password) {
  if (typeof password !== 'string' || password.length === 0) {
    return { ok: false, error: 'Password is required.' };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, error: `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.` };
  }
  return { ok: true, value: password };
}

/**
 * Policy for NEW passwords (registration, admin create/reset).
 */
export function validatePasswordPolicy(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, error: `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.` };
  }
  return { ok: true };
}

/**
 * Generates a cryptographically random session token (64 hex chars).
 * Stored in the DB with the session row and in localStorage; the
 * session is only accepted when both the row id AND token match.
 */
export function generateSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Session ids come from BIGSERIAL columns. Anything non-numeric is
 * rejected before it reaches a query (prevents PostgREST cast errors
 * and injection-shaped ids).
 */
export function isNumericId(value) {
  return NUMERIC_ID_PATTERN.test(String(value ?? ''));
}
