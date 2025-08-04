// Simple test file to verify environment utility functions
// This is not a formal test suite, just for verification

import { isProduction, isDebug } from "./utils";

// Test function to verify environment detection
export function testEnvironmentFunctions() {
  console.log("=== Environment Function Tests ===");

  // Test production detection
  console.log("isProduction():", isProduction());
  console.log("isDebug():", isDebug());

  // Test environment variable
  console.log("process.env.ENVIRONMENT:", process.env.ENVIRONMENT);
  console.log("process.env.NODE_ENV:", process.env.NODE_ENV);

  // Expected behavior:
  // - When Environment="PRODUCTION": isProduction() = true, isDebug() = false
  // - When Environment="DEBUG": isProduction() = false, isDebug() = true
  // - When Environment is undefined: both return false

  console.log("=== End Tests ===");
}

// Uncomment to run test
// testEnvironmentFunctions();
