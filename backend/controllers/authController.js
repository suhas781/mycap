import jwt from 'jsonwebtoken';
import { findByEmail, comparePassword, updatePassword, createUser, countUsers } from '../services/userService.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { isValidLoginEmail, validateSignup, normalizeEmail } from '../utils/authValidation.js';

/** Create account (signup). Email must be @mycaptain.id; default role boe. */
export async function signup(req, res) {
  const { name, email, password, confirm_password } = req.body || {};
  const validation = validateSignup({ name, email, password, confirm_password });
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  const normalizedEmail = normalizeEmail(email);
  const existing = await findByEmail(normalizedEmail);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered. Sign in or use a different email.' });
  }
  try {
    const user = await createUser({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      role: 'boe',
    });
    return res.status(201).json({
      ok: true,
      message: 'Account created. You can now sign in.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already registered.' });
    }
    return res.status(500).json({ error: err.message || 'Sign up failed' });
  }
}

/** Login: allow @mycaptain.id and @mycaptain.in. Returns JWT with user_id, role, name, email. */
export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const normalizedEmail = normalizeEmail(email);
  if (!isValidLoginEmail(normalizedEmail)) {
    return res.status(403).json({
      error: 'Use a @mycaptain.id or @mycaptain.in email to sign in.',
    });
  }
  const user = await findByEmail(normalizedEmail);
  if (!user || !(await comparePassword(password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign(
    { user_id: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

/** Change password (authenticated). Body: { currentPassword, newPassword }. */
export async function changePassword(req, res) {
  const userId = req.user?.user_id;
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password required' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  try {
    await updatePassword(userId, currentPassword, newPassword);
    return res.json({ ok: true, message: 'Password updated' });
  } catch (err) {
    const msg = err.message || 'Failed to update password';
    return res.status(400).json({ error: msg });
  }
}

/** One-time setup: can create first user only when no users exist. */
export async function setupStatus(req, res) {
  const n = await countUsers();
  return res.json({ allowed: n === 0 });
}

/** Create the first user (HR) with @mycaptain.in email. Only when no users exist. */
export async function setup(req, res) {
  const n = await countUsers();
  if (n > 0) {
    return res.status(403).json({ error: 'Setup already completed. Sign in to continue.' });
  }
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password required' });
  }
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail.endsWith('@mycaptain.in')) {
    return res.status(400).json({ error: 'Email must be a @mycaptain.in address.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const user = await createUser({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      role: 'hr',
    });
    return res.json({
      ok: true,
      message: 'First HR account created. You can now sign in.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'That email is already in use.' });
    }
    return res.status(500).json({ error: err.message || 'Setup failed' });
  }
}
