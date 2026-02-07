import { ValidationError } from './errors/AppError.js';
import { UPLOADS, MESSAGES } from './constants.js';

export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  sanitized = sanitized.trim();
  
  return sanitized;
};

export const sanitizeMessage = (text) => {
  if (!text) return text;
  
  const sanitized = sanitizeText(text);
  
  if (sanitized.length > MESSAGES.MAX_LENGTH) {
    throw new ValidationError(
      `Message cannot exceed ${MESSAGES.MAX_LENGTH} characters`
    );
  }
  
  return sanitized;
};

export const sanitizeName = (name, maxLength = 50) => {
  if (!name || typeof name !== 'string') {
    return name;
  }
  
  let sanitized = sanitizeText(name);
  
  sanitized = sanitized.replace(/[<>\"\'&]/g, '');
  
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

export const validateBase64Image = (base64String) => {
  if (!base64String || typeof base64String !== 'string') {
    throw new ValidationError('Invalid image format');
  }

  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new ValidationError('Invalid image format. Expected base64 data URI');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  if (!UPLOADS.ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new ValidationError(
      `Image type '${mimeType}' not allowed. Supported types: ${UPLOADS.ALLOWED_MIME_TYPES.join(', ')}`
    );
  }

  const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
  
  if (sizeInBytes > UPLOADS.MAX_IMAGE_SIZE) {
    const maxSizeMB = UPLOADS.MAX_IMAGE_SIZE / (1024 * 1024);
    throw new ValidationError(`Image size exceeds ${maxSizeMB}MB limit`);
  }

  return {
    mimeType,
    base64Data,
    sizeInBytes,
    dataUri: base64String
  };
};

export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return email;
  }
  
  return email.toLowerCase().trim();
};

export const sanitizeObjectId = (id) => {
  if (!id || typeof id !== 'string') {
    return null;
  }
  
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  
  if (!objectIdRegex.test(id)) {
    return null;
  }
  
  return id;
};
