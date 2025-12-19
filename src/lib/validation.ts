import { z } from 'zod';

/**
 * Comprehensive input validation schemas using Zod
 */

// Password validation - minimum 8 chars, must contain uppercase, lowercase, number
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Email validation
export const emailSchema = z
  .string()
  .trim()
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters')
  .transform(val => val.toLowerCase());

// Name validation
export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods');

// Phone validation (optional, flexible format)
export const phoneSchema = z
  .string()
  .trim()
  .max(20, 'Phone number must be less than 20 characters')
  .regex(/^[\d\s\-\+\(\)]*$/, 'Please enter a valid phone number')
  .optional()
  .or(z.literal(''));

// Address validation (optional)
export const addressSchema = z
  .string()
  .trim()
  .max(200, 'Address must be less than 200 characters')
  .optional()
  .or(z.literal(''));

// Company name validation (optional)
export const companyNameSchema = z
  .string()
  .trim()
  .max(100, 'Company name must be less than 100 characters')
  .optional()
  .or(z.literal(''));

// Text content validation (for comments, descriptions, etc.)
export const textContentSchema = z
  .string()
  .trim()
  .min(1, 'Content is required')
  .max(5000, 'Content must be less than 5000 characters');

// Comment validation
export const commentSchema = z
  .string()
  .trim()
  .min(1, 'Comment cannot be empty')
  .max(2000, 'Comment must be less than 2000 characters');

// Amount/currency validation
export const amountSchema = z
  .number()
  .min(0.01, 'Amount must be at least 0.01')
  .max(999999999.99, 'Amount exceeds maximum allowed value');

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Signup form schema
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

// Profile update schema
export const profileUpdateSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  address: addressSchema,
  companyName: companyNameSchema,
});

// Password change schema
export const passwordChangeSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Helper function to format validation errors
export function formatValidationErrors(error: z.ZodError): string {
  return error.errors.map(e => e.message).join('. ');
}

// Helper function to validate and return result
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: formatValidationErrors(result.error) };
}
