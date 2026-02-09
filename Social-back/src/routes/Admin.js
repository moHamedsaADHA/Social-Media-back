import express from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import { deleteUserAdmin, deletePostAdmin, viewStats } from '../../controllers/adminController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// protect admin routes
router.delete('/users/:id', requireAuth, asyncHandler(deleteUserAdmin));
router.delete('/posts/:id', requireAuth, asyncHandler(deletePostAdmin));
router.get('/stats', requireAuth, asyncHandler(viewStats));

export default router;
