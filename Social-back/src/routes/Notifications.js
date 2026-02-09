import express from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import { getNotificationsForUser, markNotificationRead, deleteNotification } from '../../controllers/notificationController.js';

const router = express.Router();

router.get('/user/:userId', asyncHandler(getNotificationsForUser));
router.put('/:id/read', asyncHandler(markNotificationRead));
router.delete('/:id', asyncHandler(deleteNotification));

export default router;
