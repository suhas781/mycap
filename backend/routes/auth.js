import { Router } from 'express';
import { signup, login, changePassword, setupStatus, setup } from '../controllers/authController.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.get('/setup-status', setupStatus);
router.post('/setup', setup);
router.post('/signup', signup);
router.post('/login', login);
router.post('/change-password', authRequired, changePassword);
export default router;
