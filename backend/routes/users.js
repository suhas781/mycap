import { Router } from 'express';
import { authRequired, teamLeadOnly, hrOnly, adminOrHrOnly } from '../middleware/auth.js';
import { getBoes, getTeamLeads, getAllUsers, setUserRole, setReportsTo, setEmploymentStatus } from '../controllers/userController.js';

const router = Router();
router.get('/boes', authRequired, teamLeadOnly, getBoes);
router.get('/team-leads', authRequired, adminOrHrOnly, getTeamLeads);
router.get('/', authRequired, hrOnly, getAllUsers);
router.put('/:id/role', authRequired, hrOnly, setUserRole);
router.put('/:id/reports-to', authRequired, hrOnly, setReportsTo);
router.put('/:id/employment-status', authRequired, hrOnly, setEmploymentStatus);
export default router;
