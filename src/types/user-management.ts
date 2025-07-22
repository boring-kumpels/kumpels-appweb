import * as z from "zod";
import type { UserRole } from "@prisma/client";

// User creation form schema
export const createUserFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(7, "Password must be at least 7 characters")
    .max(100, "Password must be less than 100 characters"),
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(30, "First name must be less than 30 characters")
    .optional()
    .nullable(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(30, "Last name must be less than 30 characters")
    .optional()
    .nullable(),
  role: z.enum([
    "SUPERADMIN",
    "NURSE",
    "PHARMACY_VALIDATOR",
    "PHARMACY_REGENT",
  ]),
  active: z.boolean().default(true),
});

// User update form schema (no password change here)
export const updateUserFormSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(30, "First name must be less than 30 characters")
    .optional()
    .nullable(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(30, "Last name must be less than 30 characters")
    .optional()
    .nullable(),
  role: z.enum([
    "SUPERADMIN",
    "NURSE",
    "PHARMACY_VALIDATOR",
    "PHARMACY_REGENT",
  ]),
  active: z.boolean(),
});

// User password update schema
export const updateUserPasswordSchema = z.object({
  password: z
    .string()
    .min(7, "Password must be at least 7 characters")
    .max(100, "Password must be less than 100 characters"),
});

// Type exports
export type CreateUserFormData = z.infer<typeof createUserFormSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserFormSchema>;
export type UpdateUserPasswordData = z.infer<typeof updateUserPasswordSchema>;

// User with profile combined interface for display
export interface UserWithProfile {
  id: string; // Auth user ID
  email: string;
  profile: {
    id: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

// User table action types
export type UserAction =
  | "edit"
  | "delete"
  | "deactivate"
  | "activate"
  | "reset-password";

// API response types
export interface UsersListResponse {
  users: UserWithProfile[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface UserResponse {
  user: UserWithProfile;
}

export interface UserCreationResponse {
  user: UserWithProfile;
  temporaryPassword: string;
}

// Role display names
export const roleDisplayNames: Record<UserRole, string> = {
  SUPERADMIN: "Super Admin",
  NURSE: "Nurse",
  PHARMACY_VALIDATOR: "Pharmacy Validator",
  PHARMACY_REGENT: "Pharmacy Regent",
};

// Role colors for badges
export const roleColors: Record<UserRole, string> = {
  SUPERADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  NURSE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PHARMACY_VALIDATOR:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  PHARMACY_REGENT:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};
