# 🚀 Production Deployment Checklist

## Pre-Deployment Validation

### Environment Setup
- [ ] All environment variables are set (run `npm run validate:env`)
- [ ] `NODE_ENV=production` is set
- [ ] Database connection is configured with SSL
- [ ] Redis is configured (optional but recommended)
- [ ] Session secret is at least 32 characters
- [ ] REPLIT_DOMAINS includes all deployment domains

### Database
- [ ] Run database migrations: `npm run db:migrate`
- [ ] Verify migration status: `npm run db:migrate:status`
- [ ] Verify migration integrity: `npm run db:migrate:verify`
- [ ] Run database validation: `npm run validate:db`
- [ ] Seed initial data if needed: `npm run db:seed`
- [ ] Create database backup: `npm run backup`

### Code Quality
- [ ] Run type checking: `npm run check`
- [ ] Fix any TypeScript errors
- [ ] Review security audit logs
- [ ] Test authentication flow in staging

### Build Process
- [ ] Run production build: `npm run build`
- [ ] Verify build artifacts in `dist/` directory
- [ ] Check client build in `dist/public/`
- [ ] Verify server bundle in `dist/index.js`

## Deployment Steps

### 1. Pre-Deployment
```bash
# Validate environment
npm run validate:env

# Run migrations
npm run db:migrate

# Validate database
npm run validate:db

# Run type check
npm run check

# Build production assets
npm run build
```

### 2. Deploy
```bash
# Start production server
npm start
```

### 3. Post-Deployment Verification
- [ ] Check health endpoint: `curl https://your-domain.com/health`
- [ ] Check auth health: `curl https://your-domain.com/api/auth/health`
- [ ] Check monitoring dashboard: `curl https://your-domain.com/api/monitoring`
- [ ] Test login flow manually
- [ ] Verify session persistence
- [ ] Check error logs in Sentry (if configured)

## Post-Deployment Monitoring

### First Hour
- [ ] Monitor CPU and memory usage
- [ ] Check database connection pool stats
- [ ] Review authentication audit logs
- [ ] Check for any security events
- [ ] Monitor error rates in logs

### First Day
- [ ] Review all authentication audit logs
- [ ] Check session management statistics
- [ ] Review security events dashboard
- [ ] Verify backup processes are working
- [ ] Monitor database performance

### Ongoing
- [ ] Daily review of security events
- [ ] Weekly review of audit logs
- [ ] Monthly database performance review
- [ ] Quarterly security audit

## Rollback Procedures

### Quick Rollback (Critical Issues)
```bash
# Stop the current deployment
pm2 stop all  # or your process manager

# Restore previous version from git
git checkout <previous-commit-hash>

# Rebuild
npm run build

# Restart
npm start
```

### Database Rollback
```bash
# Rollback last migration
npm run db:migrate:rollback

# Restore from backup if needed
npm run backup:restore
```

## Monitoring Endpoints

| Endpoint | Purpose | Expected Status |
|----------|---------|----------------|
| `/health` | Basic health check | 200 OK |
| `/api/auth/health` | Auth system health | 200 OK |
| `/api/monitoring` | Full monitoring dashboard | 200 OK (admin only) |
| `/metrics` | Prometheus metrics | 200 OK |

## Emergency Contacts

- **Database Issues**: Check database connection pool, review slow queries
- **Auth Issues**: Check auth_audit_logs table, review session storage
- **Security Incidents**: Check security_events table, review IP blocks
- **Performance Issues**: Check /api/monitoring dashboard, database stats

## Security Checklist

- [ ] HTTPS is enforced
- [ ] Security headers are set correctly
- [ ] CSRF protection is enabled
- [ ] Rate limiting is active
- [ ] Session security is configured
- [ ] Audit logging is working
- [ ] No sensitive data in logs
- [ ] Error messages don't leak information

## Performance Checklist

- [ ] Database connection pooling is configured
- [ ] Redis caching is working (if configured)
- [ ] Static assets are served efficiently
- [ ] Database queries are optimized with indexes
- [ ] Session storage is performant
- [ ] API response times < 200ms average

## Backup Procedures

### Automated Backups
- Database backups run daily at 2 AM UTC
- Backups are retained for 30 days
- Backup verification runs weekly

### Manual Backup
```bash
# Create manual backup
npm run backup

# Verify backup
ls -lh backups/

# Test restore (on staging only!)
npm run backup:restore
```

## Troubleshooting

### Authentication Issues
```bash
# Check auth audit logs
psql $DATABASE_URL -c "SELECT * FROM auth_audit_logs ORDER BY created_at DESC LIMIT 50;"

# Check active sessions
psql $DATABASE_URL -c "SELECT COUNT(*) FROM active_sessions WHERE expires_at > NOW();"
```

### Database Issues
```bash
# Check connection status
npm run validate:db

# View slow queries
psql $DATABASE_URL -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

### Session Issues
```bash
# Check session storage
psql $DATABASE_URL -c "SELECT COUNT(*) FROM sessions;"

# Clear expired sessions
psql $DATABASE_URL -c "DELETE FROM sessions WHERE expire < NOW();"
```

## Success Criteria

Deployment is successful when:
- ✅ Health check returns 200 OK
- ✅ Users can log in successfully
- ✅ Sessions persist across requests
- ✅ Database queries respond in < 100ms
- ✅ No critical errors in logs
- ✅ Security monitoring is active
- ✅ Audit logs are being recorded

## Notes

- Always test in staging before production
- Keep this checklist updated with lessons learned
- Document any issues and resolutions
- Review and update security policies quarterly
