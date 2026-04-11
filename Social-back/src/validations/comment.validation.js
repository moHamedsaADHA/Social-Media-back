import { body } from 'express-validator';

export const createCommentValidation = [
  body('postId').notEmpty(),
  body('text').notEmpty(),
];

export const updateCommentValidation = [
  body('text').notEmpty(),
];
