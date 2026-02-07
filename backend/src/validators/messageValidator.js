import Joi from 'joi';

export const sendMessageSchema = Joi.object({
  text: Joi.string()
    .min(1)
    .max(2000)
    .optional()
    .allow('')
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 2000 characters'
    }),
  image: Joi.string()
    .optional()
    .allow(null, '')
    .messages({
      'string.base': 'Image must be a valid base64 string'
    })
}).custom((value, helpers) => {
  const hasText = value.text && value.text.trim().length > 0;
  const hasImage = value.image && value.image.length > 0;
  
  if (!hasText && !hasImage) {
    return helpers.error('any.custom', { message: 'Either text or image is required' });
  }
  return value;
}).messages({
  'any.custom': 'Either text or image is required'
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

export const createGroupSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Group name cannot be empty',
      'string.max': 'Group name cannot exceed 100 characters',
      'any.required': 'Group name is required'
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  memberIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
      'string.pattern.base': 'Each member ID must be a valid ID'
    }))
    .optional()
    .messages({
      'array.base': 'Member IDs must be an array'
    })
});

export const addMembersSchema = Joi.object({
  memberIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
      'string.pattern.base': 'Each member ID must be a valid ID'
    }))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one member ID is required',
      'any.required': 'Member IDs are required'
    })
});