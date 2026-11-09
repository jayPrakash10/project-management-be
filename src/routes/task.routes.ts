import { Router } from 'express';
import * as commentController from '../controllers/comment.controller';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createCommentSchema } from '../validators/comment.validator';
import { paginationQuerySchema, taskIdParamsSchema } from '../validators/common.validator';
import { assignTaskSchema, updateTaskSchema, updateTaskStatusSchema } from '../validators/task.validator';

const router = Router();
const withTaskId = { params: taskIdParamsSchema };

router.use(authenticate);

router.get('/:taskId', validate(withTaskId), taskController.getById);
router.patch('/:taskId', validate({ ...withTaskId, body: updateTaskSchema }), taskController.update);
router.patch('/:taskId/assignee', validate({ ...withTaskId, body: assignTaskSchema }), taskController.assign);
router.patch('/:taskId/status', validate({ ...withTaskId, body: updateTaskStatusSchema }), taskController.changeStatus);
router.delete('/:taskId', validate(withTaskId), taskController.remove);

router.get('/:taskId/comments', validate({ ...withTaskId, query: paginationQuerySchema }), commentController.list);
router.post('/:taskId/comments', validate({ ...withTaskId, body: createCommentSchema }), commentController.create);

export default router;
