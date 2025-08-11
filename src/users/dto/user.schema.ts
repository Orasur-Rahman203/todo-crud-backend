import { z } from 'zod';

// Schema for data sent from frontend (without id)
export const CreateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  ext: z.string().min(1, 'Phone country code is required').trim(),
  phone: z
    .string()
    .min(5, 'Phone number must be at least 5 characters long')
    .trim(),
  email: z.email('Please provide a valid email address').trim().toLowerCase(),
  dateOfBirth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Date of birth must be a valid date',
    })
    .transform((val) => new Date(val)),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password must be less than 100 characters'),
  skills: z
    .array(
      z.object({
        field: z
          .string()
          .min(3, 'Skill field must be at least 3 characters long')
          .trim(),
        tags: z
          .array(
            z
              .string()
              .min(3, 'Each skill tag must be at least 3 characters long')
              .trim(),
          )
          .min(1, 'At least one skill tag is required'),
      }),
    )
    .min(1, 'At least one skill is required'),
});

// Complete user schema (with id for storage) //TODO: Remove Later after successful done
export const UserSchema = CreateUserSchema.extend({
  id: z.string(),
});

// Schema for updating user (all fields optional and id excluded)
export const UpdateUserSchema = CreateUserSchema.partial();

export type CreateUserDto = z.infer<typeof CreateUserSchema>; //TODO: Remove Later after successful done
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>; //TODO: Remove Later after successful done

// Prisma User type for database
export interface User {
  id: string;
  name: string;
  ext: string;
  phone: string;
  email: string;
  dateOfBirth: Date;
  password: string;
  skills: any; // JSON field from Prisma
  createdAt?: Date;
  updatedAt?: Date;
}

// Pagination interfaces
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}
