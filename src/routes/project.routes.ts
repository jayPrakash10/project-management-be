import { Router } from 'express';
import { PROJECT_CREATOR_ROLES } from '../config/constants';
import * as memberController from '../controllers/member.controller';
import * as projectController from '../controllers/project.controller';
import * as reportController from '../controllers/report.controller';
import * as sectionController from '../controllers/section.controller';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import {
  paginationQuerySchema,
  projectIdParamsSchema,
  projectMemberParamsSchema,
} from '../validators/common.validator';
import {
  addMemberSchema,
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from '../validators/project.validator';
import { createSectionSchema } from '../validators/section.validator';
import { createTaskSchema, listProjectTasksQuerySchema } from '../validators/task.validator';

const router = Router();
const withProjectId = { params: projectIdParamsSchema };

router.use(authenticate);

// Projects
router.get('/', validate({ query: listProjectsQuerySchema }), projectController.list);
router.post(
  '/',
  requireRole(...PROJECT_CREATOR_ROLES),
  validate({ body: createProjectSchema }),
  projectController.create,
);
router.get('/:projectId', validate(withProjectId), projectController.getById);
router.patch('/:projectId', validate({ ...withProjectId, body: updateProjectSchema }), projectController.update);
router.delete('/:projectId', validate(withProjectId), projectController.remove);

// Members
router.get('/:projectId/members', validate(withProjectId), memberController.list);
router.post('/:projectId/members', validate({ ...withProjectId, body: addMemberSchema }), memberController.add);
router.delete('/:projectId/members/:userId', validate({ params: projectMemberParamsSchema }), memberController.remove);

// Sections
router.get('/:projectId/sections', validate(withProjectId), sectionController.list);
router.post(
  '/:projectId/sections',
  validate({ ...withProjectId, body: createSectionSchema }),
  sectionController.create,
);

// Tasks
router.get(
  '/:projectId/tasks',
  validate({ ...withProjectId, query: listProjectTasksQuerySchema }),
  taskController.listForProject,
);
router.post('/:projectId/tasks', validate({ ...withProjectId, body: createTaskSchema }), taskController.create);

// Reports
router.get('/:projectId/summary', validate(withProjectId), reportController.summary);
router.get(
  '/:projectId/activity',
  validate({ ...withProjectId, query: paginationQuerySchema }),
  reportController.activity,
);

export default router;
