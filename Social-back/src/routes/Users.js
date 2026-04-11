import express from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import {
  registerUser,
  loginUser,
  getUserById,
  getMyProfile,
  updateUser,
  logoutUser,
  deleteUser,
  followUser,
} from '../../controllers/userController.js';
import validateRequest from '../middlewares/validateRequest.js';
import { registerValidation, loginValidation, updateUserValidation } from '../validations/user.validation.js';
import { cacheMiddleware } from '../utils/cache.js';
import User from '../models/User.js';
import { requireAuth } from '../middlewares/auth.js';
import { ownerOrAdmin } from '../middlewares/authorize.js';

const router = express.Router();

router.post('/register', registerValidation, validateRequest, asyncHandler(registerUser));
router.post('/login', loginValidation, validateRequest, asyncHandler(loginUser));
router.post('/logout', asyncHandler(logoutUser));
router.get('/my-profile', cacheMiddleware(30 * 1000), asyncHandler(getMyProfile));
router.get('/:id', cacheMiddleware(30 * 1000), asyncHandler(getUserById));
router.post('/:id/follow', requireAuth, asyncHandler(followUser));
router.put('/:id', requireAuth, ownerOrAdmin((req) => User.findById(req.params.id)), updateUserValidation, validateRequest, asyncHandler(updateUser));
router.delete('/:id', requireAuth, ownerOrAdmin((req) => User.findById(req.params.id)), asyncHandler(deleteUser));

export default router;
