import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Database,
  Server,
  Zap,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Building2,
  ShoppingCart,
} from "lucide-react";

interface SystemData {
  health: {
    redis: string;
    database: string;
    timestamp: string;
  };
  metrics: {
    totalUsers: number;
    totalBusinesses: number;
    totalOrders: number;
    verifiedBusinesses: number;
    activeBusinesses: number;
  };
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

export function SystemMonitoringSection() {
  const { data: system, isLoading } = useQuery<SystemData>({
    queryKey: ["/api/admin/system"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Loading system data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!system) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">No system data available</div>
        </CardContent>
      </Card>
    );
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const heapUsagePercentage = ((system.memory.heapUsed / system.memory.heapTotal) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redis</CardTitle>
            <Database className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {system.health.redis === "healthy" ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">Healthy</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">Unhealthy</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Cache service</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {system.health.database === "healthy" ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">Healthy</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">Unhealthy</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">PostgreSQL</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Uptime</CardTitle>
            <Activity className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(system.uptime)}</div>
            <p className="text-xs text-muted-foreground mt-2">Running continuously</p>
          </CardContent>
        </Card>
      </div>

      {/* Memory Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Memory Usage
          </CardTitle>
          <CardDescription>Node.js process memory consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">RSS (Resident Set Size)</p>
              <p className="text-2xl font-bold">{formatBytes(system.memory.rss)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total memory allocated</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Heap Total</p>
              <p className="text-2xl font-bold">{formatBytes(system.memory.heapTotal)}</p>
              <p className="text-xs text-muted-foreground mt-1">V8 heap size</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Heap Used</p>
              <p className="text-2xl font-bold">{formatBytes(system.memory.heapUsed)}</p>
              <Badge variant={
                parseFloat(heapUsagePercentage) > 90 ? "destructive" :
                parseFloat(heapUsagePercentage) > 70 ? "secondary" :
                "default"
              } className="mt-1">
                {heapUsagePercentage}% usage
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">External</p>
              <p className="text-2xl font-bold">{formatBytes(system.memory.external)}</p>
              <p className="text-xs text-muted-foreground mt-1">C++ objects</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Platform Metrics
          </CardTitle>
          <CardDescription>Real-time platform statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-8 w-8 text-blue-600" />
                  <span className="text-3xl font-bold">{system.metrics.totalUsers}</span>
                </div>
                <p className="text-sm font-medium">Total Users</p>
                <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Building2 className="h-8 w-8 text-green-600" />
                  <span className="text-3xl font-bold">{system.metrics.totalBusinesses}</span>
                </div>
                <p className="text-sm font-medium">Total Businesses</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default" className="text-xs">
                    {system.metrics.verifiedBusinesses} verified
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {system.metrics.activeBusinesses} active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="h-8 w-8 text-purple-600" />
                  <span className="text-3xl font-bold">{system.metrics.totalOrders}</span>
                </div>
                <p className="text-sm font-medium">Total Orders</p>
                <p className="text-xs text-muted-foreground mt-1">All time transactions</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm font-medium">Health Check Timestamp</span>
              <span className="text-sm text-muted-foreground">
                {new Date(system.health.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm font-medium">Platform Status</span>
              <Badge variant="default" className="bg-green-600">
                <Activity className="h-3 w-3 mr-1" />
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm font-medium">Environment</span>
              <Badge variant="outline">
                {process.env.NODE_ENV || "production"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Auto-refresh</span>
              <Badge variant="secondary">Every 30 seconds</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
