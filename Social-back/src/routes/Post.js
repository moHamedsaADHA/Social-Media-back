import express from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import Post from '../models/Post.js';
import {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
    likePost,
} from '../../controllers/postController.js';
import validateRequest from '../middlewares/validateRequest.js';
import { createPostValidation, updatePostValidation } from '../../post.validation.js';
import { cacheMiddleware } from '../utils/cache.js';
import { requireAuth } from '../middlewares/auth.js';
import { ownerOrAdmin } from '../middlewares/authorize.js';

const router = express.Router();

router.post('/', requireAuth, createPostValidation, validateRequest, asyncHandler(createPost));
router.get('/', cacheMiddleware(30 * 1000), asyncHandler(getPosts));
router.get('/:id', cacheMiddleware(30 * 1000), asyncHandler(getPostById));
router.post('/:id/like', requireAuth, asyncHandler(likePost));
router.put(
    '/:id',
    requireAuth,
    ownerOrAdmin((req) => Post.findById(req.params.id)),
    updatePostValidation,
    validateRequest,
    asyncHandler(updatePost),
);
router.delete(
    '/:id',
    requireAuth,
    ownerOrAdmin((req) => Post.findById(req.params.id)),
    asyncHandler(deletePost),
);

export default router;
