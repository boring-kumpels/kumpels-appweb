import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if the application is running in production mode
 * @returns boolean indicating if we're in production
 */
export function isProduction(): boolean {
  return process.env.NEXT_PUBLIC_ENVIRONMENT === "PRODUCTION";
}

/**
 * Check if the application is running in debug mode
 * @returns boolean indicating if we're in debug mode
 */
export function isDebug(): boolean {
  return process.env.NEXT_PUBLIC_ENVIRONMENT === "DEBUG";
}
