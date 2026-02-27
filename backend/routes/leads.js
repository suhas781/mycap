import { Router } from 'express';
import { authRequired, teamLeadOnly } from '../middleware/auth.js';
import {
  getLeads,
  getLead,
  getStatuses,
  createLead,
  assignLead,
  updateStatus,
  updateCollege,
  updateNamePhone,
  createConversionDetails,
  getConversionDetails,
  updateConversionDetails,
  bulkAssign,
} from '../controllers/leadController.js';

const router = Router();
router.use(authRequired);

router.get('/', getLeads);
router.post('/', createLead);
router.get('/statuses', getStatuses);
router.post('/bulk-assign', teamLeadOnly, bulkAssign);
router.get('/:id', getLead);
router.put('/:id/assign', teamLeadOnly, assignLead);
router.put('/:id/status', updateStatus);
router.put('/:id/college', teamLeadOnly, updateCollege);
router.put('/:id/name-phone', updateNamePhone);
router.post('/:id/conversion-details', createConversionDetails);
router.get('/:id/conversion-details', getConversionDetails);
router.put('/:id/conversion-details', updateConversionDetails);

export default router;
