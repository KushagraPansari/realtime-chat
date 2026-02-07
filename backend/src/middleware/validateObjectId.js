import mongoose from 'mongoose';
import { ValidationError } from '../utils/errors/AppError.js';

export const validateObjectId = (...paramNames) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const value = req.params[paramName];
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return next(new ValidationError(`Invalid ${paramName}: ${value}`));
      }
    }
    next();
  };
};

export default validateObjectId;