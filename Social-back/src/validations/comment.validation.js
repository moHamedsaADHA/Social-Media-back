import { body } from 'express-validator';

export const createCommentValidation = [
  body('userId').notEmpty(),
  body('postId').notEmpty(),
  body('text').notEmpty(),
];

export const updateCommentValidation = [
  body('text').notEmpty(),
];
