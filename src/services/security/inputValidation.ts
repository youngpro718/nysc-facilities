/**
 * Input validation and sanitization service
 * Provides comprehensive validation to prevent XSS and injection attacks
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validates and sanitizes text input to prevent XSS attacks
 */
export function validateTextInput(input: string, maxLength: number = 255): ValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Input is required and must be a string' };
  }

  // Check for XSS patterns
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      return { isValid: false, error: 'Invalid characters detected in input' };
    }
  }

  // Trim whitespace
  const trimmed = input.trim();
  
  // Check length
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `Input exceeds maximum length of ${maxLength} characters` };
  }

  // Basic HTML entity encoding for safety
  const sanitized = trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return { isValid: true, sanitized };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const trimmed = email.trim().toLowerCase();

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email exceeds maximum length' };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Validates numeric input
 */
export function validateNumber(input: string | number, min?: number, max?: number): ValidationResult {
  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num)) {
    return { isValid: false, error: 'Invalid number format' };
  }

  if (min !== undefined && num < min) {
    return { isValid: false, error: `Number must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { isValid: false, error: `Number must be at most ${max}` };
  }

  return { isValid: true, sanitized: num.toString() };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password exceeds maximum length of 128 characters' };
  }

  // Check for at least one lowercase, uppercase, number, and special character
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecial) {
    return { 
      isValid: false, 
      error: 'Password must contain at least one lowercase letter, uppercase letter, number, and special character' 
    };
  }

  return { isValid: true };
}

/**
 * Validates file upload
 */
export function validateFileUpload(
  file: File, 
  allowedTypes: string[] = [], 
  maxSize: number = 5 * 1024 * 1024 // 5MB default
): ValidationResult {
  if (!file) {
    return { isValid: false, error: 'File is required' };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type ${file.type} is not allowed` };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB` };
  }

  // Check for potentially dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.jar', '.js', '.vbs'];
  const fileName = file.name.toLowerCase();
  
  for (const ext of dangerousExtensions) {
    if (fileName.endsWith(ext)) {
      return { isValid: false, error: 'File type is not allowed for security reasons' };
    }
  }

  return { isValid: true };
}

/**
 * Rate limiting validation
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  checkLimit(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (attempt.count >= maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();