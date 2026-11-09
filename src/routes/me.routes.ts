import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { listMyTasksQuerySchema } from '../validators/task.validator';

const router = Router();

router.use(authenticate);

router.get('/tasks', validate({ query: listMyTasksQuerySchema }), taskController.listMine);

export default router;
