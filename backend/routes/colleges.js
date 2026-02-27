import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { list, create, update, remove } from '../controllers/collegeController.js';

const router = Router();
router.use(authRequired);

router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
