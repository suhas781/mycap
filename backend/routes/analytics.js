import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { teamCampaignAnalytics, adminCampaignAnalytics, teamPerformance, revenueAnalytics } from '../controllers/analyticsController.js';

const router = Router();
router.use(authRequired);

router.get('/campaigns/team', teamCampaignAnalytics);
router.get('/campaigns/admin', adminCampaignAnalytics);
router.get('/team-performance', teamPerformance);
router.get('/revenue', revenueAnalytics);

export default router;
