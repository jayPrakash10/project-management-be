import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { userIdParamsSchema } from '../validators/common.validator';
import { listUsersQuerySchema, updateRoleSchema } from '../validators/user.validator';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/', validate({ query: listUsersQuerySchema }), userController.list);
router.patch(
  '/:userId/role',
  validate({ params: userIdParamsSchema, body: updateRoleSchema }),
  userController.updateRole,
);

export default router;
