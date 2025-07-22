import { createHash } from "crypto";

/**
 * Server-side utility functions for password hashing
 * Uses Node.js crypto module for secure hashing on the server
 */

/**
 * Hashes a password using SHA-256 on the server
 *
 * @param password The password string to hash
 * @returns The hashed password as a hex string
 */
export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

/**
 * Salted password hash function for added security (server-side)
 * Combines the password with a user-specific value (like email) before hashing
 *
 * @param password The user's plain text password
 * @param salt A unique value to combine with the password (e.g., user's email)
 * @returns The salted and hashed password string
 */
export function saltAndHashPassword(password: string, salt: string): string {
  // Combine password with salt
  const saltedPassword = `${password}:${salt}`;

  // Hash the salted password
  return hashPassword(saltedPassword);
}
