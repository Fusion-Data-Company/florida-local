/**
 * Vitest test setup file
 * Runs before all tests to configure the test environment
 */

import { afterAll, vi } from 'vitest';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-key-minimum-32-characters-long';

// Mock external services by default
process.env.SKIP_EXTERNAL_SERVICES = 'true';

// Suppress console logs during tests (unless debugging)
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    // Keep error and debug for troubleshooting
  };
}

// Clean up after all tests
afterAll(async () => {
  // Close database connections, Redis connections, etc.
  // await db.end();
  // await redis.quit();
});
