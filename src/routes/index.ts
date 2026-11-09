import { Router } from 'express';
import * as healthController from '../controllers/health.controller';
import authRoutes from './auth.routes';
import commentRoutes from './comment.routes';
import meRoutes from './me.routes';
import projectRoutes from './project.routes';
import sectionRoutes from './section.routes';
import taskRoutes from './task.routes';
import userRoutes from './user.routes';

const router = Router();

router.get('/health', healthController.check);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/sections', sectionRoutes);
router.use('/tasks', taskRoutes);
router.use('/comments', commentRoutes);
router.use('/me', meRoutes);

export default router;
