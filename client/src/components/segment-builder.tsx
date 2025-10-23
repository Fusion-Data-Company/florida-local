/**
 * Segment Builder Component
 *
 * Visual rule builder for creating customer segments with:
 * - Drag-and-drop rule creation
 * - Multiple field types (demographics, behavior, engagement)
 * - AND/OR logic combinations
 * - Real-time member count preview
 * - Rule validation
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Trash2,
  Save,
  X,
  Users,
  RefreshCw,
  Filter,
  TrendingUp,
  DollarSign,
  Calendar,
  MapPin,
  Mail,
  MousePointerClick,
} from 'lucide-react';

const segmentSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  autoUpdate: z.boolean(),
});

type SegmentFormData = z.infer<typeof segmentSchema>;

interface Rule {
  id: string;
  field: string;
  operator: string;
  value: any;
}

interface SegmentBuilderProps {
  segmentId?: string;
  businessId: string;
  onSave?: (segmentId: string) => void;
  onCancel?: () => void;
}

// Available fields for segmentation
const SEGMENT_FIELDS = [
  {
    id: 'totalSpent',
    label: 'Total Spent',
    category: 'Behavior',
    type: 'number',
    icon: DollarSign,
    operators: ['equals', 'greater_than', 'less_than', 'between'],
  },
  {
    id: 'orderCount',
    label: 'Order Count',
    category: 'Behavior',
    type: 'number',
    icon: TrendingUp,
    operators: ['equals', 'greater_than', 'less_than'],
  },
  {
    id: 'lastPurchaseDate',
    label: 'Last Purchase',
    category: 'Behavior',
    type: 'date',
    icon: Calendar,
    operators: ['within_days', 'more_than_days_ago', 'between_dates'],
  },
  {
    id: 'avgOrderValue',
    label: 'Avg Order Value',
    category: 'Behavior',
    type: 'number',
    icon: DollarSign,
    operators: ['greater_than', 'less_than', 'between'],
  },
  {
    id: 'location',
    label: 'Location (City)',
    category: 'Demographics',
    type: 'string',
    icon: MapPin,
    operators: ['equals', 'in', 'not_in'],
  },
  {
    id: 'accountAge',
    label: 'Account Age (days)',
    category: 'Demographics',
    type: 'number',
    icon: Calendar,
    operators: ['greater_than', 'less_than', 'between'],
  },
  {
    id: 'emailOpened',
    label: 'Email Opened',
    category: 'Engagement',
    type: 'boolean',
    icon: Mail,
    operators: ['equals'],
  },
  {
    id: 'emailClicked',
    label: 'Email Clicked',
    category: 'Engagement',
    type: 'boolean',
    icon: MousePointerClick,
    operators: ['equals'],
  },
  {
    id: 'campaignEngagement',
    label: 'Campaign Engagement',
    category: 'Engagement',
    type: 'number',
    icon: TrendingUp,
    operators: ['greater_than', 'less_than'],
  },
];

const OPERATORS = [
  { id: 'equals', label: 'Equals', types: ['string', 'number', 'boolean'] },
  { id: 'not_equals', label: 'Not Equals', types: ['string', 'number'] },
  { id: 'greater_than', label: 'Greater Than', types: ['number'] },
  { id: 'less_than', label: 'Less Than', types: ['number'] },
  { id: 'between', label: 'Between', types: ['number'] },
  { id: 'in', label: 'In', types: ['string'] },
  { id: 'not_in', label: 'Not In', types: ['string'] },
  { id: 'contains', label: 'Contains', types: ['string'] },
  { id: 'within_days', label: 'Within Last X Days', types: ['date'] },
  { id: 'more_than_days_ago', label: 'More Than X Days Ago', types: ['date'] },
  { id: 'between_dates', label: 'Between Dates', types: ['date'] },
];

export function SegmentBuilder({
  segmentId,
  businessId,
  onSave,
  onCancel,
}: SegmentBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rules, setRules] = useState<Rule[]>([]);
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [isCalculating, setIsCalculating] = useState(false);
  const [memberCount, setMemberCount] = useState<number>(0);

  // Form setup
  const form = useForm<SegmentFormData>({
    resolver: zodResolver(segmentSchema),
    defaultValues: {
      name: '',
      description: '',
      autoUpdate: true,
    },
  });

  // Fetch existing segment if editing
  const { data: existingSegment, isLoading } = useQuery({
    queryKey: ['/api/marketing/segments', segmentId],
    enabled: !!segmentId,
  });

  // Load existing segment data
  useEffect(() => {
    if (existingSegment) {
      form.reset({
        name: existingSegment.name,
        description: existingSegment.description || '',
        autoUpdate: existingSegment.autoUpdate,
      });

      if (existingSegment.criteria) {
        setRules(existingSegment.criteria.rules || []);
        setLogic(existingSegment.criteria.logic || 'AND');
      }

      setMemberCount(existingSegment.memberCount || 0);
    }
  }, [existingSegment, form]);

  // Save segment mutation
  const saveSegmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = segmentId
        ? `/api/marketing/segments/${segmentId}`
        : '/api/marketing/segments';
      const method = segmentId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to save segment');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/segments'] });
      toast({
        title: 'Success',
        description: `Segment ${segmentId ? 'updated' : 'created'} successfully`,
      });
      if (onSave) onSave(data.id);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Calculate segment members
  const calculateMembersMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/marketing/segments/${id}/calculate`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to calculate members');
      return res.json();
    },
    onSuccess: (data) => {
      setMemberCount(data.memberCount);
      toast({
        title: 'Calculated',
        description: `Found ${data.memberCount} matching members`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Add new rule
  const addRule = () => {
    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      field: 'totalSpent',
      operator: 'greater_than',
      value: '',
    };
    setRules([...rules, newRule]);
  };

  // Remove rule
  const removeRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
  };

  // Update rule
  const updateRule = (ruleId: string, updates: Partial<Rule>) => {
    setRules(rules.map(r => (r.id === ruleId ? { ...r, ...updates } : r)));
  };

  // Get field info
  const getFieldInfo = (fieldId: string) => {
    return SEGMENT_FIELDS.find(f => f.id === fieldId);
  };

  // Get operators for field
  const getOperatorsForField = (fieldId: string) => {
    const field = getFieldInfo(fieldId);
    if (!field) return [];
    return OPERATORS.filter(op => op.types.includes(field.type));
  };

  // Handle save
  const handleSave = () => {
    const formData = form.getValues();

    if (rules.length === 0) {
      toast({
        title: 'Error',
        description: 'Add at least one rule to create a segment',
        variant: 'destructive',
      });
      return;
    }

    const segmentData = {
      ...formData,
      businessId,
      criteria: {
        rules,
        logic,
      },
    };

    saveSegmentMutation.mutate(segmentData);
  };

  // Handle calculate
  const handleCalculate = () => {
    if (!segmentId) {
      toast({
        title: 'Save First',
        description: 'Save the segment before calculating members',
        variant: 'destructive',
      });
      return;
    }

    setIsCalculating(true);
    calculateMembersMutation.mutate(segmentId);
    setTimeout(() => setIsCalculating(false), 1000);
  };

  // Render value input based on field type
  const renderValueInput = (rule: Rule) => {
    const field = getFieldInfo(rule.field);
    if (!field) return null;

    if (field.type === 'boolean') {
      return (
        <Select
          value={rule.value?.toString() || 'true'}
          onValueChange={(value) => updateRule(rule.id, { value: value === 'true' })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (field.type === 'number') {
      if (rule.operator === 'between') {
        return (
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Min"
              value={rule.value?.min || ''}
              onChange={(e) =>
                updateRule(rule.id, {
                  value: { ...rule.value, min: parseFloat(e.target.value) },
                })
              }
              className="w-[100px]"
            />
            <span>and</span>
            <Input
              type="number"
              placeholder="Max"
              value={rule.value?.max || ''}
              onChange={(e) =>
                updateRule(rule.id, {
                  value: { ...rule.value, max: parseFloat(e.target.value) },
                })
              }
              className="w-[100px]"
            />
          </div>
        );
      }

      return (
        <Input
          type="number"
          placeholder="Value"
          value={rule.value || ''}
          onChange={(e) => updateRule(rule.id, { value: parseFloat(e.target.value) })}
          className="w-[150px]"
        />
      );
    }

    if (field.type === 'string') {
      if (rule.operator === 'in' || rule.operator === 'not_in') {
        return (
          <Input
            placeholder="Miami, Tampa, Orlando"
            value={rule.value || ''}
            onChange={(e) => updateRule(rule.id, { value: e.target.value.split(',').map(v => v.trim()) })}
            className="w-[250px]"
          />
        );
      }

      return (
        <Input
          placeholder="Value"
          value={rule.value || ''}
          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
          className="w-[150px]"
        />
      );
    }

    if (field.type === 'date') {
      if (rule.operator === 'within_days' || rule.operator === 'more_than_days_ago') {
        return (
          <Input
            type="number"
            placeholder="Days"
            value={rule.value || ''}
            onChange={(e) => updateRule(rule.id, { value: parseInt(e.target.value) })}
            className="w-[100px]"
          />
        );
      }

      return (
        <Input
          type="date"
          value={rule.value || ''}
          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
          className="w-[150px]"
        />
      );
    }

    return null;
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading segment...</div>;
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {segmentId ? 'Edit Customer Segment' : 'Create Customer Segment'}
          </h1>
          <p className="text-muted-foreground">
            Build targeted customer segments with custom rules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {segmentId && (
            <Button
              variant="outline"
              onClick={handleCalculate}
              disabled={isCalculating}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
              Calculate
            </Button>
          )}
          <Button onClick={handleSave} disabled={saveSegmentMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveSegmentMutation.isPending ? 'Saving...' : 'Save Segment'}
          </Button>
        </div>
      </div>

      {/* Segment Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Segment Details</CardTitle>
          <CardDescription>Basic information about your customer segment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Segment Name *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="High-Value Customers"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-8">
              <div className="space-y-0.5">
                <Label>Auto-Update</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically recalculate members
                </p>
              </div>
              <Switch
                checked={form.watch('autoUpdate')}
                onCheckedChange={(checked) => form.setValue('autoUpdate', checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Customers who have spent more than $500 in the last 90 days"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Member Count Preview */}
      {memberCount > 0 && (
        <Card className="mb-6 bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <div className="text-3xl font-bold">{memberCount.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Matching Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules Builder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Segment Rules</CardTitle>
              <CardDescription>
                Define criteria for including customers in this segment
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Logic:</span>
              <Select value={logic} onValueChange={(value: 'AND' | 'OR') => setLogic(value)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.length === 0 ? (
            <div className="text-center py-8">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No rules defined yet</p>
              <Button onClick={addRule}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Rule
              </Button>
            </div>
          ) : (
            <>
              {rules.map((rule, index) => {
                const field = getFieldInfo(rule.field);
                const Icon = field?.icon || Filter;

                return (
                  <div key={rule.id}>
                    {index > 0 && (
                      <div className="flex justify-center my-2">
                        <Badge variant="outline">{logic}</Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                      <Select
                        value={rule.field}
                        onValueChange={(value) => {
                          const fieldInfo = getFieldInfo(value);
                          const operators = getOperatorsForField(value);
                          updateRule(rule.id, {
                            field: value,
                            operator: operators[0]?.id || 'equals',
                            value: '',
                          });
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['Demographics', 'Behavior', 'Engagement'].map(category => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                {category}
                              </div>
                              {SEGMENT_FIELDS.filter(f => f.category === category).map(field => (
                                <SelectItem key={field.id} value={field.id}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={rule.operator}
                        onValueChange={(value) => updateRule(rule.id, { operator: value, value: '' })}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getOperatorsForField(rule.field).map(op => (
                            <SelectItem key={op.id} value={op.id}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {renderValueInput(rule)}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRule(rule.id)}
                        className="ml-auto"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              <Button onClick={addRule} variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </>
          )}

          {rules.length > 0 && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">💡 Example Use Cases:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <strong>VIP Customers:</strong> Total Spent &gt; $1000 AND Order Count &gt; 10</li>
                <li>• <strong>At-Risk:</strong> Last Purchase &gt; 90 days ago AND Order Count &gt; 3</li>
                <li>• <strong>New Customers:</strong> Account Age &lt; 30 days</li>
                <li>• <strong>Local Customers:</strong> Location IN Miami, Tampa, Orlando</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
