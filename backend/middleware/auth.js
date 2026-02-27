import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

/**
 * Validates JWT and attaches req.user = { user_id, role }.
 */
export function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { user_id: decoded.user_id, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Requires role to be team_lead.
 */
export function teamLeadOnly(req, res, next) {
  if (req.user?.role !== 'team_lead') {
    return res.status(403).json({ error: 'Team Lead access required' });
  }
  next();
}

/**
 * Requires role to be boe.
 */
export function boeOnly(req, res, next) {
  if (req.user?.role !== 'boe') {
    return res.status(403).json({ error: 'BOE access required' });
  }
  next();
}

/**
 * Requires role to be hr (assign roles: team leader, BOE, etc.).
 */
export function hrOnly(req, res, next) {
  if (req.user?.role !== 'hr') {
    return res.status(403).json({ error: 'HR access required' });
  }
  next();
}

/**
 * Requires role to be admin or hr (e.g. for listing team leads for analytics).
 */
export function adminOrHrOnly(req, res, next) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'hr') {
    return res.status(403).json({ error: 'Admin or HR access required' });
  }
  next();
}

export { JWT_SECRET };
