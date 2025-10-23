import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Plus,
  Trash2,
  Save,
  Play,
  Pause,
  Copy,
  GitBranch,
  Mail,
  Clock,
  Users,
  Filter,
  Zap,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Workflow step schema
const workflowStepSchema = z.object({
  id: z.string(),
  type: z.enum(['trigger', 'condition', 'action', 'delay', 'split']),
  config: z.record(z.any()),
  nextSteps: z.array(z.string()).optional(),
});

// Workflow schema
const workflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  goal: z.string().optional(),
  trigger: z.object({
    type: z.enum([
      'form_submission',
      'email_open',
      'email_click',
      'purchase',
      'abandoned_cart',
      'segment_entry',
      'date_based',
      'api_webhook',
    ]),
    config: z.record(z.any()),
  }),
  steps: z.array(workflowStepSchema),
  isActive: z.boolean().default(false),
});

type WorkflowFormData = z.infer<typeof workflowSchema>;

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay' | 'split';
  config: Record<string, any>;
  nextSteps?: string[];
}

interface AIWorkflowSuggestion {
  workflow: {
    name: string;
    description: string;
    trigger: WorkflowFormData['trigger'];
    steps: WorkflowStep[];
  };
  reasoning: string;
  estimatedConversionLift: string;
  bestPractices: string[];
}

export function WorkflowBuilder() {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AIWorkflowSuggestion | null>(null);
  const [activeTab, setActiveTab] = useState('builder');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<WorkflowFormData>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: '',
      description: '',
      goal: '',
      trigger: {
        type: 'form_submission',
        config: {},
      },
      steps: [],
      isActive: false,
    },
  });

  // Load workflows
  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/marketing/workflows', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to load workflows');

      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workflows',
        variant: 'destructive',
      });
    }
  };

  // Generate AI workflow suggestion
  const handleGenerateAI = async () => {
    const goal = watch('goal');
    const triggerType = watch('trigger.type');

    if (!goal) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a workflow goal to generate AI suggestions',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingAI(true);
    setAiSuggestion(null);

    try {
      const response = await fetch('/api/ai/marketing/workflow/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          goal,
          trigger: triggerType,
          audience: watch('description'),
          campaignType: 'nurture',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate workflow');
      }

      const { taskId } = await response.json();

      // Poll for results
      const pollResult = async () => {
        const statusResponse = await fetch(`/api/ai/tasks/${taskId}`, {
          credentials: 'include',
        });

        if (!statusResponse.ok) throw new Error('Failed to check task status');

        const taskData = await statusResponse.json();

        if (taskData.status === 'completed') {
          setAiSuggestion(taskData.result);
          setIsGeneratingAI(false);

          toast({
            title: 'AI Workflow Generated',
            description: 'Review the AI-generated workflow and apply it to your builder',
          });
        } else if (taskData.status === 'failed') {
          throw new Error(taskData.error || 'AI generation failed');
        } else {
          setTimeout(pollResult, 2000);
        }
      };

      setTimeout(pollResult, 2000);
    } catch (error) {
      console.error('Error generating AI workflow:', error);
      setIsGeneratingAI(false);
      toast({
        title: 'AI Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate workflow',
        variant: 'destructive',
      });
    }
  };

  // Apply AI suggestion
  const handleApplyAISuggestion = () => {
    if (!aiSuggestion) return;

    setValue('name', aiSuggestion.workflow.name);
    setValue('description', aiSuggestion.workflow.description);
    setValue('trigger', aiSuggestion.workflow.trigger);
    setWorkflowSteps(aiSuggestion.workflow.steps);

    toast({
      title: 'AI Workflow Applied',
      description: 'You can now customize the workflow as needed',
    });

    setActiveTab('builder');
  };

  // Add workflow step
  const handleAddStep = (type: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      config: {},
      nextSteps: [],
    };

    setWorkflowSteps([...workflowSteps, newStep]);
  };

  // Update workflow step
  const handleUpdateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setWorkflowSteps(
      workflowSteps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    );
  };

  // Remove workflow step
  const handleRemoveStep = (stepId: string) => {
    setWorkflowSteps(workflowSteps.filter((step) => step.id !== stepId));
  };

  // Duplicate workflow step
  const handleDuplicateStep = (stepId: string) => {
    const stepToDuplicate = workflowSteps.find((step) => step.id === stepId);
    if (!stepToDuplicate) return;

    const duplicatedStep: WorkflowStep = {
      ...stepToDuplicate,
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const stepIndex = workflowSteps.findIndex((step) => step.id === stepId);
    const newSteps = [...workflowSteps];
    newSteps.splice(stepIndex + 1, 0, duplicatedStep);

    setWorkflowSteps(newSteps);
  };

  // Save workflow
  const onSubmit = async (data: WorkflowFormData) => {
    try {
      const workflowData = {
        ...data,
        steps: workflowSteps,
      };

      const url = selectedWorkflow
        ? `/api/marketing/workflows/${selectedWorkflow.id}`
        : '/api/marketing/workflows';

      const method = selectedWorkflow ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save workflow');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: selectedWorkflow
          ? 'Workflow updated successfully'
          : 'Workflow created successfully',
      });

      await loadWorkflows();
      reset();
      setWorkflowSteps([]);
      setSelectedWorkflow(null);
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save workflow',
        variant: 'destructive',
      });
    }
  };

  // Toggle workflow active status
  const handleToggleActive = async (workflowId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/marketing/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to toggle workflow');

      await loadWorkflows();

      toast({
        title: 'Success',
        description: `Workflow ${!isActive ? 'activated' : 'paused'}`,
      });
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update workflow status',
        variant: 'destructive',
      });
    }
  };

  // Delete workflow
  const handleDeleteWorkflow = async (workflowId: number) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const response = await fetch(`/api/marketing/workflows/${workflowId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete workflow');

      await loadWorkflows();

      toast({
        title: 'Success',
        description: 'Workflow deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete workflow',
        variant: 'destructive',
      });
    }
  };

  // Render workflow step component
  const renderStepIcon = (type: WorkflowStep['type']) => {
    switch (type) {
      case 'trigger':
        return <Zap className="h-4 w-4" />;
      case 'condition':
        return <GitBranch className="h-4 w-4" />;
      case 'action':
        return <Mail className="h-4 w-4" />;
      case 'delay':
        return <Clock className="h-4 w-4" />;
      case 'split':
        return <Filter className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getStepTypeLabel = (type: WorkflowStep['type']) => {
    const labels = {
      trigger: 'Trigger',
      condition: 'Condition',
      action: 'Action',
      delay: 'Delay',
      split: 'Split Test',
    };
    return labels[type];
  };

  const getStepTypeColor = (type: WorkflowStep['type']) => {
    const colors = {
      trigger: 'bg-purple-500',
      condition: 'bg-blue-500',
      action: 'bg-green-500',
      delay: 'bg-yellow-500',
      split: 'bg-orange-500',
    };
    return colors[type];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workflow Builder</h2>
          <p className="text-muted-foreground">
            Create automated marketing workflows with AI assistance
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="ai-assist">AI Assist</TabsTrigger>
          <TabsTrigger value="workflows">My Workflows</TabsTrigger>
        </TabsList>

        {/* Workflow Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Details</CardTitle>
                <CardDescription>
                  Define the basic information for your workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Workflow Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Welcome Series, Abandoned Cart Recovery"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose and audience for this workflow"
                    {...register('description')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">Workflow Goal (Optional)</Label>
                  <Input
                    id="goal"
                    placeholder="e.g., Convert leads, Reduce churn, Increase engagement"
                    {...register('goal')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used by AI to generate optimal workflow suggestions
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="triggerType">Trigger Type</Label>
                  <Select
                    value={watch('trigger.type')}
                    onValueChange={(value) =>
                      setValue('trigger.type', value as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="form_submission">Form Submission</SelectItem>
                      <SelectItem value="email_open">Email Open</SelectItem>
                      <SelectItem value="email_click">Email Click</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="abandoned_cart">Abandoned Cart</SelectItem>
                      <SelectItem value="segment_entry">Segment Entry</SelectItem>
                      <SelectItem value="date_based">Date Based</SelectItem>
                      <SelectItem value="api_webhook">API Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Workflow Steps */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Workflow Steps</CardTitle>
                    <CardDescription>
                      Build your automation sequence step by step
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(value) => handleAddStep(value as WorkflowStep['type'])}
                    >
                      <SelectTrigger className="w-[180px]">
                        <Plus className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Add Step" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="action">Action</SelectItem>
                        <SelectItem value="condition">Condition</SelectItem>
                        <SelectItem value="delay">Delay</SelectItem>
                        <SelectItem value="split">Split Test</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {workflowSteps.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No steps added yet. Click "Add Step" to start building your workflow,
                      or use AI Assist to generate a complete workflow automatically.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {workflowSteps.map((step, index) => (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          className="relative"
                        >
                          <Card className="overflow-hidden border-l-4" style={{
                            borderLeftColor: getStepTypeColor(step.type).replace('bg-', 'rgb(var(--')
                          }}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${getStepTypeColor(step.type)} text-white`}>
                                    {renderStepIcon(step.type)}
                                  </div>
                                  <div>
                                    <div className="font-semibold">
                                      Step {index + 1}: {getStepTypeLabel(step.type)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Configure this step's behavior
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDuplicateStep(step.id)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveStep(step.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {/* Step configuration would go here */}
                              <div className="text-sm text-muted-foreground">
                                Step configuration panel (implementation details vary by step type)
                              </div>
                            </CardContent>
                          </Card>

                          {index < workflowSteps.length - 1 && (
                            <div className="flex justify-center py-2">
                              <ArrowDown className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setWorkflowSteps([]);
                  setSelectedWorkflow(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {selectedWorkflow ? 'Update Workflow' : 'Create Workflow'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* AI Assist Tab */}
        <TabsContent value="ai-assist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Workflow Generator
              </CardTitle>
              <CardDescription>
                Let AI create an optimized workflow based on your goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Workflow Goal</Label>
                <Input
                  value={watch('goal') || ''}
                  onChange={(e) => setValue('goal', e.target.value)}
                  placeholder="e.g., Convert free trial users to paid customers"
                />
              </div>

              <div className="space-y-2">
                <Label>Target Audience (Optional)</Label>
                <Textarea
                  value={watch('description') || ''}
                  onChange={(e) => setValue('description', e.target.value)}
                  placeholder="Describe your target audience"
                />
              </div>

              <Button
                onClick={handleGenerateAI}
                disabled={isGeneratingAI || !watch('goal')}
                className="w-full"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating AI Workflow...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate AI Workflow
                  </>
                )}
              </Button>

              {aiSuggestion && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-4"
                >
                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        {aiSuggestion.workflow.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {aiSuggestion.workflow.description}
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Estimated Conversion Lift
                        </Label>
                        <div className="text-2xl font-bold text-green-600">
                          {aiSuggestion.estimatedConversionLift}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Workflow Steps
                        </Label>
                        <div className="text-2xl font-bold">
                          {aiSuggestion.workflow.steps.length}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        AI Reasoning
                      </Label>
                      <p className="text-sm">{aiSuggestion.reasoning}</p>
                    </div>

                    {aiSuggestion.bestPractices.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Best Practices
                        </Label>
                        <ul className="space-y-1">
                          {aiSuggestion.bestPractices.map((practice, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{practice}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      onClick={handleApplyAISuggestion}
                      className="w-full"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Apply This Workflow
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <GitBranch className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Workflows Yet</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Create your first automated workflow to start engaging with customers
                </p>
                <Button onClick={() => setActiveTab('builder')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {workflow.name}
                          <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                            {workflow.isActive ? 'Active' : 'Paused'}
                          </Badge>
                        </CardTitle>
                        {workflow.description && (
                          <CardDescription className="mt-2">
                            {workflow.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleActive(workflow.id, workflow.isActive)}
                        >
                          {workflow.isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Trigger</div>
                        <Badge variant="outline">
                          {workflow.trigger?.type?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Steps</div>
                        <div className="font-semibold">
                          {workflow.steps?.length || 0} steps
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Enrolled</div>
                        <div className="font-semibold">
                          {workflow.enrolledCount || 0} contacts
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
