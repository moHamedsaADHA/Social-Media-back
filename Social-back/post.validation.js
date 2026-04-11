import { body } from 'express-validator';

export const createPostValidation = [
  body('text').optional().isString(),
];

export const updatePostValidation = [
  body('text').optional().isString(),
];
