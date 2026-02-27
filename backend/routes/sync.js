import { Router } from 'express';
import { authRequired, teamLeadOnly } from '../middleware/auth.js';
import { syncLeads } from '../controllers/syncController.js';

const router = Router();
router.post('/', authRequired, teamLeadOnly, syncLeads);
export default router;
