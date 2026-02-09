import express from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import validateRequest from '../middlewares/validateRequest.js';
import { createComment, getCommentsByPost, getCommentById, updateComment, deleteComment } from '../../controllers/commentController.js';
import { createCommentValidation, updateCommentValidation } from '../validations/comment.validation.js';

const router = express.Router();

router.post('/', createCommentValidation, validateRequest, asyncHandler(createComment));
router.get('/post/:postId', asyncHandler(getCommentsByPost));
router.get('/:id', asyncHandler(getCommentById));
router.put('/:id', updateCommentValidation, validateRequest, asyncHandler(updateComment));
router.delete('/:id', asyncHandler(deleteComment));

export default router;
