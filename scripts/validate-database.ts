#!/usr/bin/env tsx
/**
 * Database Validation Script
 *
 * Validates database schema, data integrity, and ensures all tables are properly set up.
 */

import { db, pool, testDatabaseConnection } from '../server/db';
import { sql } from 'drizzle-orm';

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: any;
}

class DatabaseValidator {
  private results: ValidationResult[] = [];

  async runAllChecks(): Promise<boolean> {
    console.log('🔍 Starting database validation...\n');

    await this.checkConnection();
    await this.checkTables();
    await this.checkIndexes();
    await this.checkConstraints();
    await this.checkDataIntegrity();
    await this.checkPerformance();

    return this.reportResults();
  }

  private async checkConnection(): Promise<void> {
    console.log('📡 Checking database connection...');

    try {
      const connected = await testDatabaseConnection();
      if (connected) {
        this.results.push({
          passed: true,
          message: 'Database connection successful'
        });
      } else {
        this.results.push({
          passed: false,
          message: 'Database connection failed'
        });
      }
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Database connection error',
        details: error
      });
    }
  }

  private async checkTables(): Promise<void> {
    console.log('📋 Checking database tables...');

    const expectedTables = [
      'users', 'sessions', 'businesses', 'products', 'posts', 'post_likes',
      'post_comments', 'business_followers', 'spotlights', 'spotlight_history',
      'engagement_metrics', 'spotlight_votes', 'messages', 'cart_items', 'orders',
      'order_items', 'payments', 'gmb_tokens', 'gmb_sync_history', 'gmb_reviews',
      'api_keys', 'blog_posts', 'blog_categories', 'blog_tags', 'blog_post_tags',
      'blog_comments', 'blog_reactions', 'blog_bookmarks', 'blog_reading_lists',
      'blog_subscriptions', 'blog_analytics', 'blog_revisions', 'auth_audit_logs',
      'active_sessions', 'security_events'
    ];

    try {
      const result = await pool.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
      `);

      const existingTables = result.rows.map((row: any) => row.tablename);
      const missingTables = expectedTables.filter(t => !existingTables.includes(t));

      if (missingTables.length === 0) {
        this.results.push({
          passed: true,
          message: `All ${expectedTables.length} required tables exist`,
          details: { totalTables: existingTables.length }
        });
      } else {
        this.results.push({
          passed: false,
          message: `Missing ${missingTables.length} tables`,
          details: { missingTables }
        });
      }
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Failed to check tables',
        details: error
      });
    }
  }

  private async checkIndexes(): Promise<void> {
    console.log('🔍 Checking database indexes...');

    try {
      const result = await pool.query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `);

      const totalIndexes = result.rows.length;

      // Check for critical indexes
      const criticalIndexes = [
        'users_pkey',
        'sessions_pkey',
        'businesses_pkey',
        'products_pkey',
        'idx_session_expire'
      ];

      const existingIndexNames = result.rows.map((row: any) => row.indexname);
      const missingCritical = criticalIndexes.filter(i => !existingIndexNames.includes(i));

      if (missingCritical.length === 0) {
        this.results.push({
          passed: true,
          message: `Database has ${totalIndexes} indexes including all critical ones`
        });
      } else {
        this.results.push({
          passed: false,
          message: `Missing critical indexes`,
          details: { missingCritical }
        });
      }
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Failed to check indexes',
        details: error
      });
    }
  }

  private async checkConstraints(): Promise<void> {
    console.log('🔗 Checking foreign key constraints...');

    try {
      const result = await pool.query(`
        SELECT
          tc.table_name,
          tc.constraint_name,
          tc.constraint_type
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_schema = 'public'
          AND tc.constraint_type = 'FOREIGN KEY'
        ORDER BY tc.table_name
      `);

      const foreignKeyCount = result.rows.length;

      this.results.push({
        passed: true,
        message: `Database has ${foreignKeyCount} foreign key constraints`,
        details: { foreignKeyCount }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Failed to check constraints',
        details: error
      });
    }
  }

  private async checkDataIntegrity(): Promise<void> {
    console.log('✅ Checking data integrity...');

    try {
      // Check for orphaned records
      const orphanedBusinesses = await pool.query(`
        SELECT COUNT(*) as count
        FROM businesses b
        LEFT JOIN users u ON b.owner_id = u.id
        WHERE u.id IS NULL
      `);

      const orphanedProducts = await pool.query(`
        SELECT COUNT(*) as count
        FROM products p
        LEFT JOIN businesses b ON p.business_id = b.id
        WHERE b.id IS NULL
      `);

      const orphanCount =
        parseInt(orphanedBusinesses.rows[0].count) +
        parseInt(orphanedProducts.rows[0].count);

      if (orphanCount === 0) {
        this.results.push({
          passed: true,
          message: 'No orphaned records found'
        });
      } else {
        this.results.push({
          passed: false,
          message: `Found ${orphanCount} orphaned records`,
          details: {
            orphanedBusinesses: orphanedBusinesses.rows[0].count,
            orphanedProducts: orphanedProducts.rows[0].count
          }
        });
      }
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Failed to check data integrity',
        details: error
      });
    }
  }

  private async checkPerformance(): Promise<void> {
    console.log('⚡ Checking database performance...');

    try {
      // Check connection pool stats
      const poolStats = {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      };

      // Simple performance test
      const start = Date.now();
      await pool.query('SELECT 1');
      const responseTime = Date.now() - start;

      if (responseTime < 100) {
        this.results.push({
          passed: true,
          message: `Database response time: ${responseTime}ms`,
          details: { ...poolStats, responseTime }
        });
      } else {
        this.results.push({
          passed: false,
          message: `Slow database response: ${responseTime}ms (expected < 100ms)`,
          details: { ...poolStats, responseTime }
        });
      }
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Failed to check performance',
        details: error
      });
    }
  }

  private reportResults(): boolean {
    console.log('\n📊 Validation Results:\n');
    console.log('═'.repeat(70));

    let passed = 0;
    let failed = 0;

    for (const result of this.results) {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.message}`);

      if (result.details) {
        console.log(`   ${JSON.stringify(result.details, null, 2).replace(/\n/g, '\n   ')}`);
      }

      if (result.passed) {
        passed++;
      } else {
        failed++;
      }
    }

    console.log('═'.repeat(70));
    console.log(`\nTotal: ${this.results.length} checks | Passed: ${passed} | Failed: ${failed}\n`);

    if (failed === 0) {
      console.log('✅ Database validation PASSED\n');
      return true;
    } else {
      console.log('❌ Database validation FAILED\n');
      return false;
    }
  }
}

async function main() {
  const validator = new DatabaseValidator();
  const success = await validator.runAllChecks();

  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  console.error('Validation error:', error);
  process.exit(1);
});
