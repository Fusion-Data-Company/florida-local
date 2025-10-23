import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'donut';
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animated?: boolean;
  responsive?: boolean;
}

interface InteractiveChartProps {
  data: ChartDataPoint[];
  config: ChartConfig;
  title?: string;
  subtitle?: string;
  className?: string;
  onDataPointClick?: (point: ChartDataPoint, index: number) => void;
  onDataPointHover?: (point: ChartDataPoint | null, index: number | null) => void;
}

export default function InteractiveChart({
  data,
  config,
  title,
  subtitle,
  className,
  onDataPointClick,
  onDataPointHover
}: InteractiveChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [chartType, setChartType] = useState(config.type);
  const svgRef = useRef<SVGSVGElement>(null);

  // Chart dimensions
  const width = 800;
  const height = 400;
  const margin = { top: 20, right: 30, bottom: 40, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Calculate chart values
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const valueRange = maxValue - minValue;

  // Default colors
  const colors = config.colors || [
    '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#84cc16', '#6366f1', '#14b8a6'
  ];

  // Calculate positions for line/bar charts
  const getX = useCallback((index: number) => {
    return (index / (data.length - 1)) * chartWidth;
  }, [data.length, chartWidth]);

  const getY = useCallback((value: number) => {
    return chartHeight - ((value - minValue) / valueRange) * chartHeight;
  }, [minValue, valueRange, chartHeight]);

  // Handle mouse events
  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left - margin.left;
    const index = Math.round((x / chartWidth) * (data.length - 1));
    
    if (index >= 0 && index < data.length) {
      setHoveredPoint(index);
      onDataPointHover?.(data[index], index);
    } else {
      setHoveredPoint(null);
      onDataPointHover?.(null, null);
    }
  }, [data, chartWidth, margin.left, onDataPointHover]);

  const handleMouseLeave = useCallback(() => {
    setHoveredPoint(null);
    onDataPointHover?.(null, null);
  }, [onDataPointHover]);

  const handlePointClick = useCallback((index: number) => {
    setSelectedPoint(index);
    onDataPointClick?.(data[index], index);
  }, [data, onDataPointClick]);

  // Render line chart
  const renderLineChart = () => {
    const points = data.map((point, index) => {
      const x = getX(index);
      const y = getY(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <g>
        {/* Grid lines */}
        {config.showGrid && (
          <g className="text-slate-200">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={0}
                y1={ratio * chartHeight}
                x2={chartWidth}
                y2={ratio * chartHeight}
                stroke="currentColor"
                strokeWidth={0.5}
                opacity={0.3}
              />
            ))}
          </g>
        )}

        {/* Line */}
        <motion.path
          d={points}
          fill="none"
          stroke={colors[0]}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />

        {/* Data points */}
        {data.map((point, index) => {
          const x = getX(index);
          const y = getY(point.value);
          const isHovered = hoveredPoint === index;
          const isSelected = selectedPoint === index;

          return (
            <motion.circle
              key={index}
              cx={x}
              cy={y}
              r={isHovered || isSelected ? 8 : 4}
              fill={colors[0]}
              stroke="white"
              strokeWidth={2}
              className="cursor-pointer"
              onClick={() => handlePointClick(index)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.2 }}
            />
          );
        })}
      </g>
    );
  };

  // Render bar chart
  const renderBarChart = () => {
    const barWidth = chartWidth / data.length * 0.8;

    return (
      <g>
        {/* Grid lines */}
        {config.showGrid && (
          <g className="text-slate-200">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={0}
                y1={ratio * chartHeight}
                x2={chartWidth}
                y2={ratio * chartHeight}
                stroke="currentColor"
                strokeWidth={0.5}
                opacity={0.3}
              />
            ))}
          </g>
        )}

        {/* Bars */}
        {data.map((point, index) => {
          const x = getX(index) - barWidth / 2;
          const y = getY(point.value);
          const height = chartHeight - y;
          const isHovered = hoveredPoint === index;
          const isSelected = selectedPoint === index;

          return (
            <motion.rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={height}
              fill={point.color || colors[index % colors.length]}
              className="cursor-pointer"
              onClick={() => handlePointClick(index)}
              initial={{ height: 0, y: chartHeight }}
              animate={{ height, y }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
              whileHover={{ scaleY: 1.05, scaleX: 1.02 }}
            />
          );
        })}
      </g>
    );
  };

  // Render pie chart
  const renderPieChart = () => {
    const total = data.reduce((sum, point) => sum + point.value, 0);
    let currentAngle = 0;
    const radius = Math.min(chartWidth, chartHeight) / 2 - 20;
    const centerX = chartWidth / 2;
    const centerY = chartHeight / 2;

    return (
      <g>
        {data.map((point, index) => {
          const percentage = point.value / total;
          const angle = percentage * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const startAngleRad = (startAngle * Math.PI) / 180;
          const endAngleRad = (endAngle * Math.PI) / 180;
          
          const x1 = centerX + radius * Math.cos(startAngleRad);
          const y1 = centerY + radius * Math.sin(startAngleRad);
          const x2 = centerX + radius * Math.cos(endAngleRad);
          const y2 = centerY + radius * Math.sin(endAngleRad);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');

          currentAngle += angle;

          const isHovered = hoveredPoint === index;
          const isSelected = selectedPoint === index;

          return (
            <motion.path
              key={index}
              d={pathData}
              fill={point.color || colors[index % colors.length]}
              className="cursor-pointer"
              onClick={() => handlePointClick(index)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
              whileHover={{ scale: 1.05 }}
            />
          );
        })}
      </g>
    );
  };

  // Render chart based on type
  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      case 'pie':
      case 'donut':
        return renderPieChart();
      default:
        return renderLineChart();
    }
  };

  return (
    <Card className={cn('miami-glass miami-card-glow', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {title}
              </CardTitle>
            )}
            {subtitle && (
              <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
            )}
          </div>
          
          {/* Chart type selector */}
          <div className="flex gap-1">
            {['line', 'bar', 'pie'].map((type) => (
              <Button
                key={type}
                variant={chartType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType(type as any)}
                className="h-8 px-3"
              >
                {type === 'line' && <TrendingUp className="h-4 w-4" />}
                {type === 'bar' && <BarChart3 className="h-4 w-4" />}
                {type === 'pie' && <PieChart className="h-4 w-4" />}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Chart */}
        <div className="relative">
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="w-full h-auto"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {renderChart()}
            </g>
          </svg>

          {/* Tooltip */}
          <AnimatePresence>
            {hoveredPoint !== null && config.showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bg-white border border-slate-200 rounded-lg shadow-lg p-3 pointer-events-none z-10"
                style={{
                  left: `${getX(hoveredPoint) + margin.left}px`,
                  top: `${getY(data[hoveredPoint].value) + margin.top - 60}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="text-sm font-medium text-slate-900">
                  {data[hoveredPoint].label}
                </div>
                <div className="text-lg font-bold text-primary">
                  {data[hoveredPoint].value.toLocaleString()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend */}
        {config.showLegend && (
          <div className="flex flex-wrap gap-3 mt-6">
            {data.map((point, index) => (
              <div
                key={index}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handlePointClick(index)}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: point.color || colors[index % colors.length] }}
                />
                <span className="text-sm text-slate-600">{point.label}</span>
                <Badge variant="outline" className="text-xs">
                  {point.value.toLocaleString()}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {data.length}
            </div>
            <div className="text-sm text-slate-600">Data Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {maxValue.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600">Max Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(data.reduce((sum, point) => sum + point.value, 0) / data.length).toFixed(1)}
            </div>
            <div className="text-sm text-slate-600">Average</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
