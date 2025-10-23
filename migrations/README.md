# Database Migrations

This directory contains all database migrations for the Florida Local Elite platform.

## Migration System

Migrations are tracked in the `migration_history` table and applied in order.

## Running Migrations

```bash
# Apply all pending migrations
npm run db:migrate

# Create a new migration
npm run db:migrate:create -- <migration_name>

# Rollback last migration
npm run db:migrate:rollback

# Check migration status
npm run db:migrate:status
```

## Migration File Naming Convention

Migrations follow the format: `YYYYMMDDHHMMSS_description.sql`

Example: `20251016120000_add_auth_audit_logs.sql`

## Best Practices

1. Always include both UP and DOWN migrations
2. Test migrations on staging before production
3. Never modify existing migrations after they've been applied
4. Include comments explaining complex changes
5. Keep migrations atomic and focused
