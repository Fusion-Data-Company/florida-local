/**
 * Audit Log Storage Layer
 *
 * Handles all database operations for:
 * - Admin audit logs (immutable record of all admin actions)
 * - RBAC roles and permissions
 * - Error tracking and aggregation
 */

import { db } from './db';
import {
  adminAuditLogs,
  adminRoles,
  userRoles,
  errorLogs,
  users,
  type AdminAuditLog,
  type InsertAdminAuditLog,
  type AdminRole,
  type InsertAdminRole,
  type UserRole,
  type InsertUserRole,
  type ErrorLog,
  type InsertErrorLog,
} from '../shared/schema';
import { eq, and, desc, sql, gte, lte, or, like, count } from 'drizzle-orm';
import crypto from 'crypto';

export class AuditStorage {
  // ========================================
  // AUDIT LOGS
  // ========================================

  /**
   * Log an admin action (immutable)
   */
  async logAction(data: {
    adminId: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: any;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    status?: string;
    errorMessage?: string;
    metadata?: any;
  }): Promise<AdminAuditLog> {
    const [log] = await db
      .insert(adminAuditLogs)
      .values(data)
      .returning();

    return log;
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters?: {
    adminId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AdminAuditLog[]; total: number }> {
    const {
      adminId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      status,
      limit = 50,
      offset = 0,
    } = filters || {};

    // Build where conditions
    const conditions = [];
    if (adminId) conditions.push(eq(adminAuditLogs.adminId, adminId));
    if (action) conditions.push(like(adminAuditLogs.action, `%${action}%`));
    if (entityType) conditions.push(eq(adminAuditLogs.entityType, entityType));
    if (entityId) conditions.push(eq(adminAuditLogs.entityId, entityId));
    if (status) conditions.push(eq(adminAuditLogs.status, status));
    if (startDate) conditions.push(gte(adminAuditLogs.timestamp, startDate));
    if (endDate) conditions.push(lte(adminAuditLogs.timestamp, endDate));

    // Get logs with admin user info
    const logsQuery = db
      .select({
        log: adminAuditLogs,
        admin: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(adminAuditLogs)
      .leftJoin(users, eq(adminAuditLogs.adminId, users.id))
      .orderBy(desc(adminAuditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      logsQuery.where(and(...conditions));
    }

    const results = await logsQuery;

    // Get total count
    const countQuery = db
      .select({ count: count() })
      .from(adminAuditLogs);

    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ count: total }] = await countQuery;

    return {
      logs: results.map(r => ({ ...r.log, admin: r.admin })) as any[],
      total,
    };
  }

  /**
   * Get audit log statistics
   */
  async getAuditStats(startDate?: Date, endDate?: Date): Promise<{
    totalActions: number;
    uniqueAdmins: number;
    actionsByType: Array<{ action: string; count: number }>;
    recentActivity: Array<{ date: string; count: number }>;
  }> {
    const conditions = [];
    if (startDate) conditions.push(gte(adminAuditLogs.timestamp, startDate));
    if (endDate) conditions.push(lte(adminAuditLogs.timestamp, endDate));

    // Total actions
    let totalQuery = db.select({ count: count() }).from(adminAuditLogs);
    if (conditions.length > 0) {
      totalQuery = totalQuery.where(and(...conditions)) as any;
    }
    const [{ count: totalActions }] = await totalQuery;

    // Unique admins
    let uniqueQuery = db
      .selectDistinct({ adminId: adminAuditLogs.adminId })
      .from(adminAuditLogs);
    if (conditions.length > 0) {
      uniqueQuery = uniqueQuery.where(and(...conditions)) as any;
    }
    const uniqueAdmins = (await uniqueQuery).length;

    // Actions by type
    let actionsByTypeQuery = db
      .select({
        action: adminAuditLogs.action,
        count: count(),
      })
      .from(adminAuditLogs)
      .groupBy(adminAuditLogs.action)
      .orderBy(desc(count()))
      .limit(10);
    if (conditions.length > 0) {
      actionsByTypeQuery = actionsByTypeQuery.where(and(...conditions)) as any;
    }
    const actionsByType = await actionsByTypeQuery;

    // Recent activity (last 7 days)
    const recentActivity = await db.execute(sql`
      SELECT DATE(timestamp) as date, COUNT(*) as count
      FROM ${adminAuditLogs}
      WHERE timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `);

    return {
      totalActions,
      uniqueAdmins,
      actionsByType: actionsByType as any,
      recentActivity: recentActivity.rows as any,
    };
  }

  // ========================================
  // RBAC - ROLES
  // ========================================

  /**
   * Create a new admin role
   */
  async createRole(data: InsertAdminRole): Promise<AdminRole> {
    const [role] = await db
      .insert(adminRoles)
      .values({
        ...data,
        permissions: data.permissions as string[], // Explicit type cast for jsonb field
      })
      .returning();

    return role;
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<AdminRole[]> {
    return await db
      .select()
      .from(adminRoles)
      .orderBy(adminRoles.name);
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<AdminRole | null> {
    const [role] = await db
      .select()
      .from(adminRoles)
      .where(eq(adminRoles.id, id))
      .limit(1);

    return role || null;
  }

  /**
   * Update a role
   */
  async updateRole(id: string, data: Partial<InsertAdminRole>): Promise<AdminRole> {
    const updateData: Partial<InsertAdminRole> & { updatedAt: Date } = { 
      ...data, 
      updatedAt: new Date() 
    };
    if (data.permissions) {
      updateData.permissions = data.permissions as string[]; // Explicit type cast for jsonb field
    }
    
    const [role] = await db
      .update(adminRoles)
      .set(updateData)
      .where(eq(adminRoles.id, id))
      .returning();

    return role;
  }

  /**
   * Delete a role (only if not system role)
   */
  async deleteRole(id: string): Promise<void> {
    // First check if it's a system role
    const role = await this.getRoleById(id);
    if (role?.isSystemRole) {
      throw new Error('Cannot delete system role');
    }

    // Delete all user assignments first
    await db.delete(userRoles).where(eq(userRoles.roleId, id));

    // Delete the role
    await db.delete(adminRoles).where(eq(adminRoles.id, id));
  }

  // ========================================
  // RBAC - USER ROLES
  // ========================================

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleId: string, assignedBy: string): Promise<UserRole> {
    const [userRole] = await db
      .insert(userRoles)
      .values({ userId, roleId, assignedBy })
      .returning();

    return userRole;
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
  }

  /**
   * Get user's roles
   */
  async getUserRoles(userId: string): Promise<AdminRole[]> {
    const results = await db
      .select({ role: adminRoles })
      .from(userRoles)
      .innerJoin(adminRoles, eq(userRoles.roleId, adminRoles.id))
      .where(eq(userRoles.userId, userId));

    return results.map(r => r.role);
  }

  /**
   * Get user's permissions (aggregated from all roles)
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const roles = await this.getUserRoles(userId);
    const permissions = new Set<string>();

    roles.forEach(role => {
      if (role.permissions) {
        role.permissions.forEach(permission => permissions.add(permission));
      }
    });

    return Array.from(permissions);
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission) || permissions.includes('*'); // * is superadmin
  }

  /**
   * Get users with specific role
   */
  async getUsersWithRole(roleId: string): Promise<Array<{ user: any; assignedBy: any; assignedAt: Date }>> {
    const results = await db
      .select({
        user: users,
        assignedBy: users,
        assignedAt: userRoles.assignedAt,
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(eq(userRoles.roleId, roleId));

    return results as any;
  }

  // ========================================
  // ERROR TRACKING
  // ========================================

  /**
   * Log an error (or increment count if exists)
   */
  async logError(data: {
    message: string;
    stack?: string;
    category: string;
    severity: string;
    userId?: string;
    requestPath?: string;
    requestMethod?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ErrorLog> {
    // Generate hash for deduplication
    const errorHash = crypto
      .createHash('sha256')
      .update(`${data.category}:${data.message}`)
      .digest('hex');

    // Check if error already exists
    const [existing] = await db
      .select()
      .from(errorLogs)
      .where(eq(errorLogs.errorHash, errorHash))
      .limit(1);

    if (existing) {
      // Update existing error
      const [updated] = await db
        .update(errorLogs)
        .set({
          count: sql`${errorLogs.count} + 1`,
          lastSeenAt: new Date(),
          userId: data.userId || existing.userId,
          requestPath: data.requestPath || existing.requestPath,
          stack: data.stack || existing.stack,
        })
        .where(eq(errorLogs.id, existing.id))
        .returning();

      return updated;
    }

    // Create new error log
    const [errorLog] = await db
      .insert(errorLogs)
      .values({
        ...data,
        errorHash,
        count: 1,
      })
      .returning();

    return errorLog;
  }

  /**
   * Get error logs with filters
   */
  async getErrorLogs(filters?: {
    category?: string;
    severity?: string;
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ errors: ErrorLog[]; total: number }> {
    const {
      category,
      severity,
      resolved,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = filters || {};

    const conditions = [];
    if (category) conditions.push(eq(errorLogs.category, category));
    if (severity) conditions.push(eq(errorLogs.severity, severity));
    if (resolved !== undefined) conditions.push(eq(errorLogs.resolved, resolved));
    if (startDate) conditions.push(gte(errorLogs.lastSeenAt, startDate));
    if (endDate) conditions.push(lte(errorLogs.lastSeenAt, endDate));

    let query = db
      .select()
      .from(errorLogs)
      .orderBy(desc(errorLogs.lastSeenAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const errors = await query;

    // Get total count
    let countQuery = db.select({ count: count() }).from(errorLogs);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }
    const [{ count: total }] = await countQuery;

    return { errors, total };
  }

  /**
   * Mark error as resolved
   */
  async resolveError(id: string, resolvedBy: string, notes?: string): Promise<ErrorLog> {
    const [error] = await db
      .update(errorLogs)
      .set({
        resolved: true,
        resolvedBy,
        resolvedAt: new Date(),
        notes,
      })
      .where(eq(errorLogs.id, id))
      .returning();

    return error;
  }

  /**
   * Get error statistics
   */
  async getErrorStats(startDate?: Date, endDate?: Date): Promise<{
    totalErrors: number;
    unresolvedErrors: number;
    errorsByCategory: Array<{ category: string; count: number }>;
    errorsBySeverity: Array<{ severity: string; count: number }>;
    topErrors: Array<{ message: string; count: number; severity: string }>;
  }> {
    const conditions = [];
    if (startDate) conditions.push(gte(errorLogs.lastSeenAt, startDate));
    if (endDate) conditions.push(lte(errorLogs.lastSeenAt, endDate));

    // Total errors (sum of counts)
    let totalQuery = db
      .select({ total: sql<number>`SUM(${errorLogs.count})` })
      .from(errorLogs);
    if (conditions.length > 0) {
      totalQuery = totalQuery.where(and(...conditions)) as any;
    }
    const [{ total: totalErrors }] = await totalQuery;

    // Unresolved errors
    let unresolvedQuery = db
      .select({ count: count() })
      .from(errorLogs)
      .where(eq(errorLogs.resolved, false));
    if (conditions.length > 0) {
      unresolvedQuery = unresolvedQuery.where(and(...conditions, eq(errorLogs.resolved, false))) as any;
    }
    const [{ count: unresolvedErrors }] = await unresolvedQuery;

    // Errors by category
    let categoryQuery = db
      .select({
        category: errorLogs.category,
        count: sql<number>`SUM(${errorLogs.count})`,
      })
      .from(errorLogs)
      .groupBy(errorLogs.category)
      .orderBy(desc(sql`SUM(${errorLogs.count})`));
    if (conditions.length > 0) {
      categoryQuery = categoryQuery.where(and(...conditions)) as any;
    }
    const errorsByCategory = await categoryQuery;

    // Errors by severity
    let severityQuery = db
      .select({
        severity: errorLogs.severity,
        count: sql<number>`SUM(${errorLogs.count})`,
      })
      .from(errorLogs)
      .groupBy(errorLogs.severity)
      .orderBy(desc(sql`SUM(${errorLogs.count})`));
    if (conditions.length > 0) {
      severityQuery = severityQuery.where(and(...conditions)) as any;
    }
    const errorsBySeverity = await severityQuery;

    // Top errors
    let topQuery = db
      .select({
        message: errorLogs.message,
        count: errorLogs.count,
        severity: errorLogs.severity,
      })
      .from(errorLogs)
      .orderBy(desc(errorLogs.count))
      .limit(10);
    if (conditions.length > 0) {
      topQuery = topQuery.where(and(...conditions)) as any;
    }
    const topErrors = await topQuery;

    return {
      totalErrors: Number(totalErrors) || 0,
      unresolvedErrors,
      errorsByCategory: errorsByCategory as any,
      errorsBySeverity: errorsBySeverity as any,
      topErrors: topErrors as any,
    };
  }

  /**
   * Initialize default roles
   */
  async initializeDefaultRoles(): Promise<void> {
    const defaultRoles = [
      {
        name: 'Super Admin',
        description: 'Full access to all platform features and settings',
        permissions: ['*'], // Wildcard permission
        isSystemRole: true,
      },
      {
        name: 'Content Moderator',
        description: 'Can moderate blog posts, business posts, and products',
        permissions: [
          'content.read',
          'content.moderate',
          'content.delete',
          'blog.read',
          'blog.moderate',
          'posts.read',
          'posts.moderate',
          'products.read',
          'products.moderate',
        ],
        isSystemRole: true,
      },
      {
        name: 'Support Agent',
        description: 'Can view and assist users, manage tickets',
        permissions: [
          'users.read',
          'users.impersonate',
          'businesses.read',
          'orders.read',
          'messages.read',
          'support.manage',
        ],
        isSystemRole: true,
      },
      {
        name: 'Analytics Viewer',
        description: 'Read-only access to analytics and reports',
        permissions: [
          'analytics.read',
          'reports.read',
          'system.read',
          'users.read',
          'businesses.read',
        ],
        isSystemRole: true,
      },
      {
        name: 'Marketing Manager',
        description: 'Manage marketing campaigns, segments, and emails',
        permissions: [
          'marketing.read',
          'marketing.write',
          'campaigns.manage',
          'segments.manage',
          'emails.send',
          'users.read',
        ],
        isSystemRole: true,
      },
    ];

    for (const roleData of defaultRoles) {
      // Check if role already exists
      const [existing] = await db
        .select()
        .from(adminRoles)
        .where(eq(adminRoles.name, roleData.name))
        .limit(1);

      if (!existing) {
        await this.createRole(roleData);
      }
    }
  }
}

// Export singleton instance
export const auditStorage = new AuditStorage();
