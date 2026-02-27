import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import {
  createBoeCampaign,
  listBoeCampaigns,
  listTeamCampaigns,
  getOne,
  addLeads,
  getLeads,
} from '../controllers/boeCampaignController.js';

const router = Router();
router.use(authRequired);

router.post('/boe', createBoeCampaign);
router.get('/boe', listBoeCampaigns);
router.get('/team', listTeamCampaigns);
router.get('/:id', getOne);
router.post('/:id/leads', addLeads);
router.get('/:id/leads', getLeads);

export default router;
