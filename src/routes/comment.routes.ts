import { Router } from 'express';
import * as commentController from '../controllers/comment.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { commentIdParamsSchema } from '../validators/common.validator';

const router = Router();

router.use(authenticate);

router.delete('/:commentId', validate({ params: commentIdParamsSchema }), commentController.remove);

export default router;
