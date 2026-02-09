import express from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
    likePost,
} from '../../controllers/postController.js';
import validateRequest from '../middlewares/validateRequest.js';
import { createPostValidation, updatePostValidation } from '../validations/post.validation.js';
import { cacheMiddleware } from '../utils/cache.js';

const router = express.Router();
    
router.post('/', createPostValidation, validateRequest, asyncHandler(createPost));
router.get('/', cacheMiddleware(30 * 1000), asyncHandler(getPosts));
router.get('/:id', cacheMiddleware(30 * 1000), asyncHandler(getPostById));
router.post('/:id/like', asyncHandler(likePost));
router.put('/:id', updatePostValidation, validateRequest, asyncHandler(updatePost));
router.delete('/:id', asyncHandler(deletePost));

export default router;
