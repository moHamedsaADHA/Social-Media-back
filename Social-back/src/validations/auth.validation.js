import { body } from 'express-validator';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const changePasswordValidation = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(passwordRegex),
  body('confirmNewPassword').notEmpty(),
];

export default { changePasswordValidation };