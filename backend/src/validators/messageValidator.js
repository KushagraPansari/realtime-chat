import Joi from 'joi';

export const sendMessageSchema = Joi.object({
  text: Joi.string()
    .min(1)
    .max(2000)
    .when('image', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required()
    })
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 2000 characters',
      'any.required': 'Message text or image is required'
    }),
  image: Joi.string()
    .optional()
    .messages({
      'string.base': 'Image must be a valid base64 string'
    })
}).or('text', 'image').messages({
  'object.missing': 'Either text or image is required'
});

export const editMessageSchema = Joi.object({
  text: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 2000 characters',
      'any.required': 'Message text is required'
    })
});

export const addReactionSchema = Joi.object({
  emoji: Joi.string()
    .required()
    .pattern(/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]$/u)
    .messages({
      'string.pattern.base': 'Invalid emoji format',
      'any.required': 'Emoji is required'
    })
});