import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  AlertTriangle,
  Activity,
  Key,
  Clock,
  MapPin,
  Monitor,
  Smartphone,
  Globe,
} from "lucide-react";
import { useState } from "react";

interface AuthAuditLog {
  id: string;
  userId: string;
  eventType: string;
  eventStatus: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface ActiveSession {
  id: string;
  userId: string;
  sessionId: string;
  ipAddress: string;
  deviceType: string;
  browser: string;
  os: string;
  isCurrent: boolean;
  lastActivity: string;
  expiresAt: string;
}

interface SecurityEvent {
  id: string;
  eventType: string;
  severity: string;
  description: string;
  ipAddress: string;
  resolved: boolean;
  createdAt: string;
}

interface TokenStatus {
  accountId: string;
  platform: string;
  userId: string;
  status: string;
  needsRefresh: boolean;
  expiresAt: string | null;
}

export function SecuritySection() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch recent audit logs
  const { data: auditLogs = [] } = useQuery<AuthAuditLog[]>({
    queryKey: ["/api/admin/auth-audit-logs"],
  });

  // Fetch active sessions
  const { data: activeSessions = [] } = useQuery<ActiveSession[]>({
    queryKey: ["/api/admin/active-sessions"],
  });

  // Fetch security events
  const { data: securityEvents = [] } = useQuery<SecurityEvent[]>({
    queryKey: ["/api/admin/security-events"],
  });

  // Fetch OAuth token status
  const { data: tokenStatus } = useQuery<{ tokens: TokenStatus[] }>({
    queryKey: ["/api/admin/token-status"],
  });

  const failedLogins = auditLogs.filter(log =>
    log.eventType === 'login' && log.eventStatus === 'failure'
  ).length;

  const suspiciousEvents = securityEvents.filter(e =>
    e.severity === 'high' && !e.resolved
  ).length;

  const expiringTokens = tokenStatus?.tokens.filter(t =>
    t.needsRefresh
  ).length || 0;

  return (
    <div className="space-y-6">
      {/* Security Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeSessions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeSessions.filter(s => s.isCurrent).length} current
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{failedLogins}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{suspiciousEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Unresolved</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OAuth Tokens</CardTitle>
            <Key className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{expiringTokens}</div>
            <p className="text-xs text-muted-foreground mt-1">Need refresh</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Security Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="tokens">OAuth Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Failed Logins */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Failed Logins</CardTitle>
                <CardDescription>Suspicious login attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLogs
                    .filter(log => log.eventType === 'login' && log.eventStatus === 'failure')
                    .slice(0, 5)
                    .map(log => (
                      <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{log.ipAddress}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="destructive">Failed</Badge>
                      </div>
                    ))}
                  {auditLogs.filter(log => log.eventType === 'login' && log.eventStatus === 'failure').length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No failed login attempts
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active Sessions Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Currently logged in users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeSessions.slice(0, 5).map(session => (
                    <div key={session.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        {session.deviceType === 'mobile' ? (
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{session.browser} on {session.os}</p>
                          <p className="text-xs text-muted-foreground">{session.ipAddress}</p>
                        </div>
                      </div>
                      {session.isCurrent && <Badge variant="outline">Current</Badge>}
                    </div>
                  ))}
                  {activeSessions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No active sessions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Active Sessions</CardTitle>
              <CardDescription>Monitor all user sessions across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.map(session => (
                  <Card key={session.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {session.deviceType === 'mobile' ? (
                            <Smartphone className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Monitor className="h-5 w-5 text-blue-600" />
                          )}
                          <span className="font-semibold">{session.browser} on {session.os}</span>
                          {session.isCurrent && <Badge>Current</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {session.ipAddress}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Last active: {new Date(session.lastActivity).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Expires: {new Date(session.expiresAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {activeSessions.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No active sessions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Audit Logs</CardTitle>
              <CardDescription>Complete history of authentication events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs.slice(0, 20).map(log => (
                  <div key={log.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={log.eventStatus === 'success' ? 'default' : 'destructive'}>
                          {log.eventType}
                        </Badge>
                        <span className="text-sm">{log.ipAddress}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {log.userAgent}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {log.eventStatus === 'success' ? 'Success' : 'Failed'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No audit logs yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>Suspicious activities and security incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents.slice(0, 20).map(event => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              event.severity === 'high' ? 'destructive' :
                              event.severity === 'medium' ? 'default' :
                              'secondary'
                            }
                          >
                            {event.severity.toUpperCase()}
                          </Badge>
                          <span className="font-semibold">{event.eventType}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>IP: {event.ipAddress}</span>
                          <span>{new Date(event.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      {event.resolved ? (
                        <Badge variant="outline">Resolved</Badge>
                      ) : (
                        <Badge variant="destructive">Active</Badge>
                      )}
                    </div>
                  </Card>
                ))}
                {securityEvents.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No security events</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>OAuth Token Status</CardTitle>
              <CardDescription>Social media account token health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tokenStatus?.tokens.map(token => (
                  <div key={token.accountId} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium capitalize">{token.platform}</p>
                        <p className="text-xs text-muted-foreground">
                          {token.expiresAt ? `Expires: ${new Date(token.expiresAt).toLocaleDateString()}` : 'No expiry'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        token.status === 'expired' ? 'destructive' :
                        token.status === 'expiring_soon' ? 'default' :
                        token.status === 'valid' ? 'outline' :
                        'secondary'
                      }
                    >
                      {token.status === 'expiring_soon' ? 'Expiring Soon' : token.status}
                    </Badge>
                  </div>
                ))}
                {(!tokenStatus?.tokens || tokenStatus.tokens.length === 0) && (
                  <p className="text-center py-8 text-muted-foreground">No OAuth tokens configured</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
