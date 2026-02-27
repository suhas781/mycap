import jwt from 'jsonwebtoken';
import { findByEmail, comparePassword } from '../services/userService.js';
import { JWT_SECRET } from '../middleware/auth.js';

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const user = await findByEmail(email);
  if (!user || !(await comparePassword(password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign(
    { user_id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
