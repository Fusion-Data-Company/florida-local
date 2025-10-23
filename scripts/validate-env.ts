#!/usr/bin/env tsx
/**
 * Production Environment Validation
 *
 * Validates that all required environment variables and configurations
 * are set correctly for production deployment
 */

import fs from 'fs';
import path from 'path';

interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

class EnvironmentValidator {
  private checks: ValidationCheck[] = [];

  async runAllChecks(): Promise<boolean> {
    console.log('🔍 Starting environment validation...\n');

    this.checkNodeEnvironment();
    this.checkDatabaseConfig();
    this.checkAuthConfig();
    this.checkRedisConfig();
    this.checkSecurityConfig();
    this.checkProductionSettings();
    this.checkFilePermissions();

    return this.reportResults();
  }

  private checkNodeEnvironment(): void {
    console.log('📦 Checking Node.js environment...');

    // Check Node version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion >= 18) {
      this.checks.push({
        name: 'Node.js Version',
        passed: true,
        message: `Node.js ${nodeVersion} is supported`,
        severity: 'info'
      });
    } else {
      this.checks.push({
        name: 'Node.js Version',
        passed: false,
        message: `Node.js ${nodeVersion} is outdated. Minimum required: v18`,
        severity: 'critical'
      });
    }

    // Check NODE_ENV
    const nodeEnv = process.env.NODE_ENV;

    if (nodeEnv === 'production') {
      this.checks.push({
        name: 'NODE_ENV',
        passed: true,
        message: 'NODE_ENV is set to production',
        severity: 'info'
      });
    } else {
      this.checks.push({
        name: 'NODE_ENV',
        passed: false,
        message: `NODE_ENV is '${nodeEnv}', should be 'production'`,
        severity: 'warning'
      });
    }
  }

  private checkDatabaseConfig(): void {
    console.log('🗄️  Checking database configuration...');

    // Check DATABASE_URL
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL;

      if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
        this.checks.push({
          name: 'DATABASE_URL',
          passed: true,
          message: 'DATABASE_URL is configured correctly',
          severity: 'info'
        });

        // Check if using SSL
        if (dbUrl.includes('sslmode=require') || dbUrl.includes('?ssl=true')) {
          this.checks.push({
            name: 'Database SSL',
            passed: true,
            message: 'Database connection uses SSL',
            severity: 'info'
          });
        } else {
          this.checks.push({
            name: 'Database SSL',
            passed: false,
            message: 'Database connection should use SSL in production',
            severity: 'warning'
          });
        }
      } else {
        this.checks.push({
          name: 'DATABASE_URL',
          passed: false,
          message: 'DATABASE_URL format is invalid',
          severity: 'critical'
        });
      }
    } else {
      this.checks.push({
        name: 'DATABASE_URL',
        passed: false,
        message: 'DATABASE_URL is not set',
        severity: 'critical'
      });
    }
  }

  private checkAuthConfig(): void {
    console.log('🔐 Checking authentication configuration...');

    // Check SESSION_SECRET
    const sessionSecret = process.env.SESSION_SECRET;

    if (sessionSecret) {
      if (sessionSecret.length >= 32) {
        this.checks.push({
          name: 'SESSION_SECRET',
          passed: true,
          message: 'SESSION_SECRET is set with adequate length',
          severity: 'info'
        });
      } else {
        this.checks.push({
          name: 'SESSION_SECRET',
          passed: false,
          message: 'SESSION_SECRET should be at least 32 characters',
          severity: 'warning'
        });
      }
    } else {
      this.checks.push({
        name: 'SESSION_SECRET',
        passed: false,
        message: 'SESSION_SECRET is not set',
        severity: 'critical'
      });
    }

    // Check REPL_ID
    if (process.env.REPL_ID) {
      this.checks.push({
        name: 'REPL_ID',
        passed: true,
        message: 'REPL_ID is configured',
        severity: 'info'
      });
    } else {
      this.checks.push({
        name: 'REPL_ID',
        passed: false,
        message: 'REPL_ID is not set',
        severity: 'critical'
      });
    }

    // Check REPLIT_DOMAINS
    if (process.env.REPLIT_DOMAINS) {
      const domains = process.env.REPLIT_DOMAINS.split(',');

      if (domains.length > 0) {
        this.checks.push({
          name: 'REPLIT_DOMAINS',
          passed: true,
          message: `REPLIT_DOMAINS configured with ${domains.length} domain(s)`,
          severity: 'info'
        });
      }
    } else {
      this.checks.push({
        name: 'REPLIT_DOMAINS',
        passed: false,
        message: 'REPLIT_DOMAINS is not set',
        severity: 'critical'
      });
    }

    // Check ISSUER_URL
    if (process.env.ISSUER_URL) {
      this.checks.push({
        name: 'ISSUER_URL',
        passed: true,
        message: 'ISSUER_URL is configured',
        severity: 'info'
      });
    } else {
      this.checks.push({
        name: 'ISSUER_URL',
        passed: false,
        message: 'ISSUER_URL is not set (will use default)',
        severity: 'warning'
      });
    }
  }

  private checkRedisConfig(): void {
    console.log('📮 Checking Redis configuration...');

    const redisHost = process.env.REDIS_HOST;
    const redisPort = process.env.REDIS_PORT;

    if (redisHost && redisPort) {
      this.checks.push({
        name: 'Redis Configuration',
        passed: true,
        message: `Redis configured at ${redisHost}:${redisPort}`,
        severity: 'info'
      });

      if (process.env.REDIS_PASSWORD) {
        this.checks.push({
          name: 'Redis Security',
          passed: true,
          message: 'Redis password is configured',
          severity: 'info'
        });
      } else {
        this.checks.push({
          name: 'Redis Security',
          passed: false,
          message: 'Redis password is not set (should be set for production)',
          severity: 'warning'
        });
      }
    } else {
      this.checks.push({
        name: 'Redis Configuration',
        passed: false,
        message: 'Redis is not configured (will use fallback session storage)',
        severity: 'warning'
      });
    }
  }

  private checkSecurityConfig(): void {
    console.log('🛡️  Checking security configuration...');

    // Check if Sentry is configured
    if (process.env.SENTRY_DSN) {
      this.checks.push({
        name: 'Sentry Error Tracking',
        passed: true,
        message: 'Sentry error tracking is configured',
        severity: 'info'
      });
    } else {
      this.checks.push({
        name: 'Sentry Error Tracking',
        passed: false,
        message: 'Sentry DSN not configured (error tracking disabled)',
        severity: 'warning'
      });
    }

    // Check if dangerous env vars are not set
    const dangerousVars = ['DEBUG', 'VERBOSE_ERRORS', 'DISABLE_RATE_LIMIT'];

    for (const varName of dangerousVars) {
      if (process.env[varName]) {
        this.checks.push({
          name: `Dangerous Variable: ${varName}`,
          passed: false,
          message: `${varName} should not be set in production`,
          severity: 'critical'
        });
      }
    }
  }

  private checkProductionSettings(): void {
    console.log('⚙️  Checking production settings...');

    // Check if build directory exists
    const distPath = path.join(process.cwd(), 'dist');

    if (fs.existsSync(distPath)) {
      this.checks.push({
        name: 'Build Directory',
        passed: true,
        message: 'Production build directory exists',
        severity: 'info'
      });

      // Check if server bundle exists
      const serverBundle = path.join(distPath, 'index.js');

      if (fs.existsSync(serverBundle)) {
        this.checks.push({
          name: 'Server Bundle',
          passed: true,
          message: 'Server bundle exists',
          severity: 'info'
        });
      } else {
        this.checks.push({
          name: 'Server Bundle',
          passed: false,
          message: 'Server bundle not found. Run npm run build',
          severity: 'critical'
        });
      }

      // Check if client build exists
      const clientBuild = path.join(distPath, 'public', 'index.html');

      if (fs.existsSync(clientBuild)) {
        this.checks.push({
          name: 'Client Build',
          passed: true,
          message: 'Client build exists',
          severity: 'info'
        });
      } else {
        this.checks.push({
          name: 'Client Build',
          passed: false,
          message: 'Client build not found. Run npm run build',
          severity: 'critical'
        });
      }
    } else {
      this.checks.push({
        name: 'Build Directory',
        passed: false,
        message: 'Production build not found. Run npm run build',
        severity: 'critical'
      });
    }
  }

  private checkFilePermissions(): void {
    console.log('📁 Checking file permissions...');

    try {
      // Check if we can read package.json
      const packageJson = path.join(process.cwd(), 'package.json');
      fs.accessSync(packageJson, fs.constants.R_OK);

      this.checks.push({
        name: 'File Permissions',
        passed: true,
        message: 'File permissions are correct',
        severity: 'info'
      });
    } catch (error) {
      this.checks.push({
        name: 'File Permissions',
        passed: false,
        message: 'File permission issues detected',
        severity: 'critical'
      });
    }
  }

  private reportResults(): boolean {
    console.log('\n📊 Validation Results:\n');
    console.log('═'.repeat(80));

    let critical = 0;
    let warnings = 0;
    let passed = 0;

    // Group by severity
    const criticalChecks = this.checks.filter(c => !c.passed && c.severity === 'critical');
    const warningChecks = this.checks.filter(c => !c.passed && c.severity === 'warning');
    const passedChecks = this.checks.filter(c => c.passed);

    // Show critical failures first
    if (criticalChecks.length > 0) {
      console.log('\n❌ CRITICAL FAILURES:\n');
      for (const check of criticalChecks) {
        console.log(`  ❌ ${check.name}: ${check.message}`);
        critical++;
      }
    }

    // Show warnings
    if (warningChecks.length > 0) {
      console.log('\n⚠️  WARNINGS:\n');
      for (const check of warningChecks) {
        console.log(`  ⚠️  ${check.name}: ${check.message}`);
        warnings++;
      }
    }

    // Show passed checks
    console.log('\n✅ PASSED:\n');
    for (const check of passedChecks) {
      console.log(`  ✅ ${check.name}: ${check.message}`);
      passed++;
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`\nTotal: ${this.checks.length} checks | Passed: ${passed} | Warnings: ${warnings} | Critical: ${critical}\n`);

    if (critical > 0) {
      console.log('❌ VALIDATION FAILED - Critical issues must be resolved before production deployment\n');
      return false;
    } else if (warnings > 0) {
      console.log('⚠️  VALIDATION PASSED WITH WARNINGS - Review warnings before production deployment\n');
      return true;
    } else {
      console.log('✅ VALIDATION PASSED - Environment is ready for production deployment\n');
      return true;
    }
  }
}

async function main() {
  const validator = new EnvironmentValidator();
  const success = await validator.runAllChecks();

  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  console.error('Validation error:', error);
  process.exit(1);
});
