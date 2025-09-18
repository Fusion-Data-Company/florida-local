import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface MagicDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  onExport?: (data: T[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export default function MagicDataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  sortable = true,
  filterable = true,
  selectable = true,
  paginated = true,
  pageSize = 10,
  onRowClick,
  onSelectionChange,
  onExport,
  loading = false,
  emptyMessage = "No data available",
  className
}: MagicDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = data;

    // Apply search
    if (searchTerm) {
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(row =>
          String(row[key]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    return result;
  }, [data, searchTerm, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, paginated]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handlers
  const handleSort = useCallback((key: keyof T) => {
    if (!sortable) return;

    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  }, [sortable]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedRows(paginatedData);
      onSelectionChange?.(paginatedData);
    } else {
      setSelectedRows([]);
      onSelectionChange?.([]);
    }
  }, [paginatedData, onSelectionChange]);

  const handleSelectRow = useCallback((row: T, checked: boolean) => {
    const newSelection = checked
      ? [...selectedRows, row]
      : selectedRows.filter(r => r !== row);
    
    setSelectedRows(newSelection);
    onSelectionChange?.(newSelection);
  }, [selectedRows, onSelectionChange]);

  const handleFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="miami-glass rounded-2xl p-6 miami-card-glow">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gradient-to-r from-slate-200/50 to-slate-300/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("miami-glass rounded-2xl overflow-hidden miami-card-glow", className)}>
      {/* Header with Search and Actions */}
      <div className="p-6 border-b border-white/20">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {searchable && (
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 group-hover:text-primary transition-colors duration-300" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/80 border-white/30 focus:border-primary/50 transition-all duration-300"
                />
              </div>
            )}
            
            {filterable && (
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="glass-panel border-white/30 hover:border-primary/50">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 p-4">
                    <div className="space-y-3">
                      {columns.filter(col => col.filterable).map((column) => (
                        <div key={String(column.key)}>
                          <label className="text-sm font-medium text-slate-700 mb-1 block">
                            {column.title}
                          </label>
                          <Input
                            placeholder={`Filter by ${column.title}`}
                            value={filters[String(column.key)] || ''}
                            onChange={(e) => handleFilter(String(column.key), e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearFilters}
                        className="w-full"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {onExport && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onExport(sortedData)}
                className="glass-panel border-white/30 hover:border-primary/50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            
            {selectedRows.length > 0 && (
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {selectedRows.length} selected
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-white/10 to-white/5">
            <tr>
              {selectable && (
                <th className="w-12 p-4">
                  <Checkbox
                    checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "p-4 text-left font-semibold text-slate-700",
                    column.align === 'center' && "text-center",
                    column.align === 'right' && "text-right",
                    column.sortable && "cursor-pointer hover:bg-white/20 transition-colors duration-200"
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp 
                          className={cn(
                            "h-3 w-3 transition-colors duration-200",
                            sortConfig?.key === column.key && sortConfig.direction === 'asc' 
                              ? "text-primary" 
                              : "text-slate-400"
                          )}
                        />
                        <ChevronDown 
                          className={cn(
                            "h-3 w-3 -mt-1 transition-colors duration-200",
                            sortConfig?.key === column.key && sortConfig.direction === 'desc' 
                              ? "text-primary" 
                              : "text-slate-400"
                          )}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-12 p-4"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {paginatedData.map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={cn(
                    "border-b border-white/10 hover:bg-white/5 transition-all duration-200 cursor-pointer group",
                    selectedRows.includes(row) && "bg-primary/10"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="p-4">
                      <Checkbox
                        checked={selectedRows.includes(row)}
                        onCheckedChange={(checked) => handleSelectRow(row, !!checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        "p-4 text-slate-600 group-hover:text-slate-900 transition-colors duration-200",
                        column.align === 'center' && "text-center",
                        column.align === 'right' && "text-right"
                      )}
                    >
                      {column.render 
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || '-')
                      }
                    </td>
                  ))}
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {paginatedData.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-12 text-center"
        >
          <div className="text-slate-400 mb-4">
            <Search className="h-12 w-12 mx-auto opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No data found</h3>
          <p className="text-slate-500">{emptyMessage}</p>
        </motion.div>
      )}

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="p-6 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="glass-panel border-white/30"
              >
                Previous
              </Button>
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "min-w-[40px]",
                    currentPage === i + 1 
                      ? "bg-primary text-white" 
                      : "glass-panel border-white/30"
                  )}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="glass-panel border-white/30"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
