import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import InteractiveChart from './InteractiveChart';
import { ChartDataPoint } from './InteractiveChart';
import { cn } from '@/lib/utils';

export interface Metric {
  id: string;
  title: string;
  value: number | string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
  format?: 'number' | 'currency' | 'percentage';
}

export interface AnalyticsData {
  metrics: Metric[];
  charts: {
    revenue: ChartDataPoint[];
    users: ChartDataPoint[];
    engagement: ChartDataPoint[];
    conversion: ChartDataPoint[];
  };
  topContent: Array<{
    id: string;
    title: string;
    type: 'business' | 'product' | 'post';
    views: number;
    likes: number;
    shares: number;
    conversion: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'view' | 'like' | 'share' | 'purchase';
    user: string;
    content: string;
    timestamp: Date;
  }>;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  timeRange: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange: (range: '7d' | '30d' | '90d' | '1y') => void;
  className?: string;
}

export default function AnalyticsDashboard({
  data,
  timeRange,
  onTimeRangeChange,
  className
}: AnalyticsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Format metric values
  const formatMetricValue = (value: number | string, format?: string) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('en-US').format(value);
    }
  };

  // Get change color
  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-emerald-600 bg-emerald-50';
      case 'decrease':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  // Get change icon
  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-3 w-3" />;
      case 'decrease':
        return <TrendingUp className="h-3 w-3 rotate-180" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h2>
          <p className="text-slate-600">Monitor your business performance and insights</p>
        </div>
        
        {/* Time range selector */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeRangeChange(range)}
              className="px-4"
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={cn(
                'miami-glass miami-card-glow cursor-pointer transition-all duration-300',
                selectedMetric === metric.id && 'ring-2 ring-primary'
              )}
              onClick={() => setSelectedMetric(
                selectedMetric === metric.id ? null : metric.id
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatMetricValue(metric.value, metric.format)}
                    </p>
                  </div>
                  <div 
                    className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      metric.color
                    )}
                  >
                    {metric.icon}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', getChangeColor(metric.changeType))}
                  >
                    {getChangeIcon(metric.changeType)}
                    <span className="ml-1">
                      {Math.abs(metric.change).toFixed(1)}%
                    </span>
                  </Badge>
                  <span className="text-xs text-slate-500">
                    vs previous period
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <InteractiveChart
            data={data.charts.revenue}
            config={{
              type: 'line',
              colors: ['#10b981'],
              showGrid: true,
              showLegend: false,
              showTooltip: true,
              animated: true
            }}
            title="Revenue"
            subtitle="Daily revenue over time"
          />
        </motion.div>

        {/* Users Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <InteractiveChart
            data={data.charts.users}
            config={{
              type: 'bar',
              colors: ['#3b82f6'],
              showGrid: true,
              showLegend: false,
              showTooltip: true,
              animated: true
            }}
            title="Active Users"
            subtitle="Daily active users"
          />
        </motion.div>

        {/* Engagement Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <InteractiveChart
            data={data.charts.engagement}
            config={{
              type: 'area',
              colors: ['#8b5cf6'],
              showGrid: true,
              showLegend: false,
              showTooltip: true,
              animated: true
            }}
            title="Engagement"
            subtitle="User engagement metrics"
          />
        </motion.div>

        {/* Conversion Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <InteractiveChart
            data={data.charts.conversion}
            config={{
              type: 'pie',
              colors: ['#f59e0b', '#ef4444', '#06b6d4', '#84cc16'],
              showGrid: false,
              showLegend: true,
              showTooltip: true,
              animated: true
            }}
            title="Conversion Funnel"
            subtitle="User conversion breakdown"
          />
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="miami-glass miami-card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Top Performing Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topContent.map((content, index) => (
                  <motion.div
                    key={content.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 truncate max-w-[200px]">
                          {content.title}
                        </p>
                        <p className="text-sm text-slate-500">
                          {content.type}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Eye className="h-4 w-4" />
                        <span>{content.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Heart className="h-4 w-4" />
                        <span>{content.likes.toLocaleString()}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {content.conversion.toFixed(1)}%
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="miami-glass miami-card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 transition-colors duration-200"
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      activity.type === 'view' && 'bg-blue-100 text-blue-600',
                      activity.type === 'like' && 'bg-red-100 text-red-600',
                      activity.type === 'share' && 'bg-green-100 text-green-600',
                      activity.type === 'purchase' && 'bg-emerald-100 text-emerald-600'
                    )}>
                      {activity.type === 'view' && <Eye className="h-4 w-4" />}
                      {activity.type === 'like' && <Heart className="h-4 w-4" />}
                      {activity.type === 'share' && <Share2 className="h-4 w-4" />}
                      {activity.type === 'purchase' && <ShoppingBag className="h-4 w-4" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {activity.user}
                      </p>
                      <p className="text-sm text-slate-600 truncate">
                        {activity.content}
                      </p>
                    </div>
                    
                    <div className="text-xs text-slate-500">
                      {activity.timestamp.toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
