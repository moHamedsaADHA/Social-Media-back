import { body } from 'express-validator';

export const registerValidation = [
  body('username').isString().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
];

export const loginValidation = [
  body('email').isEmail(),
  body('password').isString().notEmpty(),
];

export const updateUserValidation = [
  body('name').optional().isString(),
  body('bio').optional().isString(),
  body('avatar').optional().isString(),
  body('location').optional().isString(),
];
