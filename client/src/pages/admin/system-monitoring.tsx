import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  MemoryStick,
  Monitor,
  RefreshCw,
  Server,
  Shield,
  Trash2,
  Zap,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CircuitBoard,
  Gauge,
  XCircle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  version: string;
  timestamp: string;
  services: {
    database: { status: string; responseTime: number };
    redis: { status: string; memory: number };
    ai: { status: string; queueSize: number };
    email: { status: string; sent: number };
  };
}

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  stack?: string;
  userId?: string;
  endpoint?: string;
}

interface PerformanceMetric {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  requestCount: number;
  errorRate: number;
}

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  details: any;
  ip: string;
}

interface CircuitBreaker {
  service: string;
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailure?: string;
  nextAttempt?: string;
}

export default function SystemMonitoring() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Check if user is admin
  useEffect(() => {
    if (user?.id !== "1") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user, setLocation, toast]);

  // System Health Query
  const { data: health, isLoading: healthLoading } = useQuery<SystemHealth>({
    queryKey: ['/api/monitoring/health'],
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Monitoring Dashboard Query
  const { data: dashboard } = useQuery({
    queryKey: ['/api/monitoring/dashboard'],
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Error Logs Query
  const { data: errors, isLoading: errorsLoading } = useQuery<ErrorLog[]>({
    queryKey: ['/api/monitoring/errors'],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Performance Metrics Query
  const { data: performance } = useQuery<PerformanceMetric[]>({
    queryKey: ['/api/monitoring/performance'],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Audit Logs Query
  const { data: audits } = useQuery<AuditLog[]>({
    queryKey: ['/api/monitoring/audits'],
    refetchInterval: autoRefresh ? 60000 : false,
  });

  // AI Stats Query
  const { data: aiStats } = useQuery({
    queryKey: ['/api/monitoring/ai'],
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // System Info Query
  const { data: systemInfo } = useQuery({
    queryKey: ['/api/monitoring/system-info'],
  });

  // Clear Error Logs Mutation
  const clearErrorsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/monitoring/errors/clear'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monitoring/errors'] });
      toast({
        title: "Error Logs Cleared",
        description: "All error logs have been cleared successfully.",
      });
    },
  });

  // Clear Performance Metrics Mutation
  const clearPerformanceMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/monitoring/performance/clear'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monitoring/performance'] });
      toast({
        title: "Performance Metrics Cleared",
        description: "All performance metrics have been reset.",
      });
    },
  });

  // Reset Circuit Breakers Mutation
  const resetBreakersMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/monitoring/circuit-breakers/reset'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monitoring/system-info'] });
      toast({
        title: "Circuit Breakers Reset",
        description: "All circuit breakers have been reset successfully.",
      });
    },
  });

  const getHealthColor = (status?: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getErrorLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!user || user.id !== "1") return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                System Monitoring
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time system health, performance metrics, and logs
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={health?.status === 'healthy' ? 'default' : 'destructive'}>
                {health?.status || 'Unknown'}
              </Badge>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={cn(
                  "h-4 w-4 mr-2",
                  autoRefresh && "animate-spin"
                )} />
                {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", getHealthColor(health?.status))}>
                {health?.status || 'Loading...'}
              </div>
              <p className="text-xs text-muted-foreground">
                Uptime: {health ? formatUptime(health.uptime) : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {errors ? errors.filter(e => e.level === 'error').length : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance && performance.length > 0
                  ? Math.round(performance.reduce((acc, p) => acc + p.avgResponseTime, 0) / performance.length)
                  : 0}ms
              </div>
              <p className="text-xs text-muted-foreground">
                Across all endpoints
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Tasks</CardTitle>
              <CircuitBoard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {aiStats?.queueSize || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                In queue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="ai">AI Stats</TabsTrigger>
            <TabsTrigger value="system">System Info</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-6">
              {/* Service Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Status</CardTitle>
                  <CardDescription>Real-time status of all system services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5" />
                        <span className="font-medium">Database</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={health?.services.database.status === 'connected' ? 'default' : 'destructive'}>
                          {health?.services.database.status || 'Unknown'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {health?.services.database.responseTime}ms
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Server className="h-5 w-5" />
                        <span className="font-medium">Redis Cache</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={health?.services.redis.status === 'connected' ? 'default' : 'destructive'}>
                          {health?.services.redis.status || 'Unknown'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {health ? formatBytes(health.services.redis.memory) : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CircuitBoard className="h-5 w-5" />
                        <span className="font-medium">AI Service</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={health?.services.ai.status === 'operational' ? 'default' : 'destructive'}>
                          {health?.services.ai.status || 'Unknown'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {health?.services.ai.queueSize} tasks
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5" />
                        <span className="font-medium">Email Service</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={health?.services.email.status === 'operational' ? 'default' : 'destructive'}>
                          {health?.services.email.status || 'Unknown'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {health?.services.email.sent} sent
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Circuit Breakers */}
              {systemInfo?.circuitBreakers && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Circuit Breakers</CardTitle>
                        <CardDescription>Service protection status</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetBreakersMutation.mutate()}
                        disabled={resetBreakersMutation.isPending}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {systemInfo.circuitBreakers.map((breaker: CircuitBreaker) => (
                        <div key={breaker.service} className="flex items-center justify-between">
                          <span className="font-medium">{breaker.service}</span>
                          <Badge
                            variant={
                              breaker.state === 'closed' ? 'default' :
                              breaker.state === 'half-open' ? 'secondary' : 'destructive'
                            }
                          >
                            {breaker.state}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Errors Tab */}
          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Error Logs</CardTitle>
                    <CardDescription>Recent errors and warnings</CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => clearErrorsMutation.mutate()}
                    disabled={clearErrorsMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {errorsLoading ? (
                    <div className="text-center py-8">Loading errors...</div>
                  ) : errors && errors.length > 0 ? (
                    <div className="space-y-4">
                      {errors.map((error) => (
                        <div
                          key={error.id}
                          className={cn(
                            "p-4 border rounded-lg",
                            error.level === 'error' && "border-red-200 bg-red-50 dark:bg-red-950/20",
                            error.level === 'warning' && "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20",
                            error.level === 'info' && "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getErrorLevelIcon(error.level)}
                              <span className="font-medium">{error.category}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(error.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-2 text-sm">{error.message}</p>
                          {error.endpoint && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Endpoint: {error.endpoint}
                            </p>
                          )}
                          {error.stack && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs text-muted-foreground">
                                Stack trace
                              </summary>
                              <pre className="mt-2 text-xs overflow-x-auto bg-slate-100 dark:bg-slate-800 p-2 rounded">
                                {error.stack}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No errors found
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>API endpoint performance statistics</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearPerformanceMutation.mutate()}
                    disabled={clearPerformanceMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Metrics
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {performance && performance.length > 0 ? (
                    <div className="space-y-4">
                      {performance
                        .sort((a, b) => b.requestCount - a.requestCount)
                        .map((metric, idx) => (
                          <div key={idx} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{metric.method}</Badge>
                                <span className="font-mono text-sm">{metric.endpoint}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {metric.requestCount} requests
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Avg Response</p>
                                <p className="font-medium">{Math.round(metric.avgResponseTime)}ms</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">P95 Response</p>
                                <p className="font-medium">{Math.round(metric.p95ResponseTime)}ms</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Error Rate</p>
                                <p className={cn(
                                  "font-medium",
                                  metric.errorRate > 5 && "text-red-600"
                                )}>
                                  {metric.errorRate.toFixed(2)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No performance data available
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>User actions and system changes</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {audits && audits.length > 0 ? (
                    <div className="space-y-2">
                      {audits.map((audit) => (
                        <div key={audit.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{audit.action}</span>
                              <Badge variant="outline">{audit.resource}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              User {audit.userId} • {audit.ip}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(audit.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No audit logs available
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Stats Tab */}
          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle>AI Service Statistics</CardTitle>
                <CardDescription>AI agent performance and queue metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {aiStats ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Queue Status</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Pending Tasks</span>
                          <span className="font-medium">{aiStats.queueSize}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Processing</span>
                          <span className="font-medium">{aiStats.processing}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Completed Today</span>
                          <span className="font-medium text-green-600">{aiStats.completedToday}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Failed Today</span>
                          <span className="font-medium text-red-600">{aiStats.failedToday}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Model Usage</h3>
                      <div className="space-y-3">
                        {aiStats.modelUsage && Object.entries(aiStats.modelUsage).map(([model, count]) => (
                          <div key={model} className="flex justify-between">
                            <span className="text-sm">{model}</span>
                            <span className="font-medium">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading AI statistics...
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Info Tab */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Server and environment details</CardDescription>
              </CardHeader>
              <CardContent>
                {systemInfo ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3">Environment</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Node Version</span>
                          <span className="font-mono text-sm">{systemInfo.nodeVersion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Platform</span>
                          <span className="font-mono text-sm">{systemInfo.platform}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">CPU Cores</span>
                          <span className="font-mono text-sm">{systemInfo.cpuCount}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold mb-3">Memory Usage</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm">Heap Used</span>
                            <span className="text-sm">
                              {systemInfo.memory && formatBytes(systemInfo.memory.heapUsed)} /
                              {systemInfo.memory && formatBytes(systemInfo.memory.heapTotal)}
                            </span>
                          </div>
                          <Progress
                            value={systemInfo.memory ? (systemInfo.memory.heapUsed / systemInfo.memory.heapTotal) * 100 : 0}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm">External</span>
                            <span className="text-sm">{systemInfo.memory && formatBytes(systemInfo.memory.external)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading system information...
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}