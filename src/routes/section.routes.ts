import { Router } from 'express';
import * as sectionController from '../controllers/section.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { sectionIdParamsSchema } from '../validators/common.validator';
import { updateSectionSchema } from '../validators/section.validator';

const router = Router();

router.use(authenticate);

router.patch(
  '/:sectionId',
  validate({ params: sectionIdParamsSchema, body: updateSectionSchema }),
  sectionController.update,
);
router.delete('/:sectionId', validate({ params: sectionIdParamsSchema }), sectionController.remove);

export default router;
