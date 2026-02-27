import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { getCourses, createCourse } from '../controllers/courseController.js';

const router = Router();
router.use(authRequired);

router.get('/', getCourses);
router.post('/', createCourse);

export default router;
