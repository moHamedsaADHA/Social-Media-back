import { body } from 'express-validator';

export const createPostValidation = [
  body('userId').notEmpty().withMessage('userId is required'),
  body('text').optional().isString(),
];

export const updatePostValidation = [
  body('text').optional().isString(),
];
