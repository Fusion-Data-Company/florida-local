import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Plus,
  Trash2,
  Save,
  Eye,
  Copy,
  GripVertical,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  Users,
  Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Form field schema
const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum([
    'text',
    'email',
    'phone',
    'textarea',
    'select',
    'checkbox',
    'radio',
    'date',
    'number',
  ]),
  label: z.string().min(1, 'Label is required'),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  validation: z.record(z.any()).optional(),
});

// Lead form schema
const leadFormSchema = z.object({
  name: z.string().min(1, 'Form name is required'),
  description: z.string().optional(),
  fields: z.array(formFieldSchema),
  successMessage: z.string().optional(),
  redirectUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

type LeadFormData = z.infer<typeof leadFormSchema>;
type FormField = z.infer<typeof formFieldSchema>;

interface AIFormOptimization {
  optimizedFields: FormField[];
  reasoning: string;
  conversionRateEstimate: string;
  recommendations: Array<{
    type: 'add' | 'remove' | 'modify' | 'reorder';
    field: string;
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  bestPractices: string[];
}

export function LeadFormBuilder() {
  const { toast } = useToast();
  const [forms, setForms] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiOptimization, setAiOptimization] = useState<AIFormOptimization | null>(null);
  const [activeTab, setActiveTab] = useState('builder');
  const [previewMode, setPreviewMode] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: '',
      description: '',
      fields: [],
      successMessage: 'Thank you for your submission!',
      redirectUrl: '',
      isActive: true,
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'fields',
  });

  // Load forms
  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const response = await fetch('/api/marketing/lead-forms', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to load forms');

      const data = await response.json();
      setForms(data.forms || []);
    } catch (error) {
      console.error('Error loading forms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load forms',
        variant: 'destructive',
      });
    }
  };

  // Add field
  const handleAddField = (type: FormField['type']) => {
    const newField: FormField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      label: `New ${type} field`,
      placeholder: '',
      required: false,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    };

    append(newField);
  };

  // Generate AI optimization
  const handleOptimizeWithAI = async () => {
    const formFields = watch('fields');

    if (!formFields || formFields.length === 0) {
      toast({
        title: 'No Fields',
        description: 'Add some fields to your form before optimizing',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingAI(true);
    setAiOptimization(null);

    try {
      const response = await fetch('/api/ai/marketing/form/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          formId: selectedForm?.id,
          fields: formFields,
          conversionRate: selectedForm?.conversionRate,
          dropOffPoint: selectedForm?.dropOffPoint,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to optimize form');
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
          setAiOptimization(taskData.result);
          setIsGeneratingAI(false);

          toast({
            title: 'AI Optimization Complete',
            description: 'Review the AI recommendations for your form',
          });
        } else if (taskData.status === 'failed') {
          throw new Error(taskData.error || 'AI optimization failed');
        } else {
          setTimeout(pollResult, 2000);
        }
      };

      setTimeout(pollResult, 2000);
    } catch (error) {
      console.error('Error optimizing form:', error);
      setIsGeneratingAI(false);
      toast({
        title: 'AI Optimization Failed',
        description: error instanceof Error ? error.message : 'Failed to optimize form',
        variant: 'destructive',
      });
    }
  };

  // Apply AI optimization
  const handleApplyAIOptimization = () => {
    if (!aiOptimization) return;

    setValue('fields', aiOptimization.optimizedFields);

    toast({
      title: 'AI Optimization Applied',
      description: 'Your form has been optimized based on AI recommendations',
    });

    setActiveTab('builder');
  };

  // Save form
  const onSubmit = async (data: LeadFormData) => {
    try {
      const url = selectedForm
        ? `/api/marketing/lead-forms/${selectedForm.id}`
        : '/api/marketing/lead-forms';

      const method = selectedForm ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save form');
      }

      toast({
        title: 'Success',
        description: selectedForm ? 'Form updated successfully' : 'Form created successfully',
      });

      await loadForms();
      reset();
      setSelectedForm(null);
    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save form',
        variant: 'destructive',
      });
    }
  };

  // Delete form
  const handleDeleteForm = async (formId: number) => {
    if (!confirm('Are you sure you want to delete this form?')) return;

    try {
      const response = await fetch(`/api/marketing/lead-forms/${formId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete form');

      await loadForms();

      toast({
        title: 'Success',
        description: 'Form deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting form:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete form',
        variant: 'destructive',
      });
    }
  };

  // Duplicate form
  const handleDuplicateForm = async (formId: number) => {
    const formToDuplicate = forms.find((f) => f.id === formId);
    if (!formToDuplicate) return;

    try {
      const response = await fetch('/api/marketing/lead-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formToDuplicate,
          name: `${formToDuplicate.name} (Copy)`,
          id: undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to duplicate form');

      await loadForms();

      toast({
        title: 'Success',
        description: 'Form duplicated successfully',
      });
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate form',
        variant: 'destructive',
      });
    }
  };

  // Render field icon
  const renderFieldIcon = (type: FormField['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'date':
        return <Calendar className="h-4 w-4" />;
      case 'textarea':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Render form preview
  const renderFormPreview = () => {
    const formFields = watch('fields');

    return (
      <div className="space-y-4 max-w-2xl mx-auto p-6 bg-background border rounded-lg">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">{watch('name') || 'Form Preview'}</h3>
          {watch('description') && (
            <p className="text-muted-foreground">{watch('description')}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          {formFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {field.type === 'textarea' ? (
                <Textarea placeholder={field.placeholder} />
              ) : field.type === 'select' ? (
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || 'Select an option'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option, index) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <Label className="font-normal">{field.placeholder || field.label}</Label>
                </div>
              ) : (
                <Input type={field.type} placeholder={field.placeholder} />
              )}
            </div>
          ))}
        </div>

        <Button className="w-full">Submit</Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lead Form Builder</h2>
          <p className="text-muted-foreground">
            Create high-converting lead capture forms with AI optimization
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="ai-optimize">AI Optimize</TabsTrigger>
          <TabsTrigger value="forms">My Forms</TabsTrigger>
        </TabsList>

        {/* Form Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Builder Panel */}
            <div className="space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Form Details</CardTitle>
                    <CardDescription>Basic information about your form</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Form Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Contact Form, Newsletter Signup"
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
                        placeholder="Describe the purpose of this form"
                        {...register('description')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="successMessage">Success Message</Label>
                      <Input
                        id="successMessage"
                        placeholder="Thank you for your submission!"
                        {...register('successMessage')}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={watch('isActive')}
                        onCheckedChange={(checked) => setValue('isActive', checked)}
                      />
                      <Label className="font-normal">Form is active</Label>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Form Fields</CardTitle>
                        <CardDescription>Add and configure form fields</CardDescription>
                      </div>
                      <Select onValueChange={(value) => handleAddField(value as FormField['type'])}>
                        <SelectTrigger className="w-[180px]">
                          <Plus className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Add Field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="textarea">Text Area</SelectItem>
                          <SelectItem value="select">Dropdown</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                          <SelectItem value="radio">Radio Buttons</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {fields.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No fields added yet. Click "Add Field" to start building your form.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                          {fields.map((field, index) => (
                            <motion.div
                              key={field.id}
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -100 }}
                            >
                              <Card>
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                      <div className="p-2 rounded bg-primary/10">
                                        {renderFieldIcon(field.type)}
                                      </div>
                                      <div>
                                        <div className="font-semibold capitalize">
                                          {field.type} Field
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {field.required ? 'Required' : 'Optional'}
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => remove(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="space-y-2">
                                    <Label>Field Label</Label>
                                    <Input
                                      {...register(`fields.${index}.label`)}
                                      placeholder="Enter field label"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Placeholder (Optional)</Label>
                                    <Input
                                      {...register(`fields.${index}.placeholder`)}
                                      placeholder="Enter placeholder text"
                                    />
                                  </div>

                                  {(field.type === 'select' || field.type === 'radio') && (
                                    <div className="space-y-2">
                                      <Label>Options (comma-separated)</Label>
                                      <Input
                                        value={field.options?.join(', ') || ''}
                                        onChange={(e) => {
                                          const options = e.target.value
                                            .split(',')
                                            .map((o) => o.trim())
                                            .filter(Boolean);
                                          setValue(`fields.${index}.options`, options);
                                        }}
                                        placeholder="Option 1, Option 2, Option 3"
                                      />
                                    </div>
                                  )}

                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={field.required}
                                      onCheckedChange={(checked) =>
                                        setValue(`fields.${index}.required`, checked)
                                      }
                                    />
                                    <Label className="font-normal">Required field</Label>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      reset();
                      setSelectedForm(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {previewMode ? 'Edit' : 'Preview'}
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
                        {selectedForm ? 'Update Form' : 'Create Form'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Preview Panel */}
            <div className="lg:sticky lg:top-6 lg:h-fit">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>
                    See how your form will look to users
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderFormPreview()}</CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* AI Optimize Tab */}
        <TabsContent value="ai-optimize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Form Optimizer
              </CardTitle>
              <CardDescription>
                Optimize your form for maximum conversions using AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  AI will analyze your form fields and suggest improvements to increase
                  conversion rates by reducing friction and improving user experience.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleOptimizeWithAI}
                disabled={isGeneratingAI || fields.length === 0}
                className="w-full"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Form...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Optimize with AI
                  </>
                )}
              </Button>

              {aiOptimization && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-4"
                >
                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          Optimization Complete
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Estimated conversion rate improvement
                        </p>
                      </div>
                      <div className="text-3xl font-bold text-green-600 flex items-center gap-2">
                        <TrendingUp className="h-6 w-6" />
                        {aiOptimization.conversionRateEstimate}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">AI Analysis</Label>
                      <p className="text-sm">{aiOptimization.reasoning}</p>
                    </div>

                    {aiOptimization.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Recommendations ({aiOptimization.recommendations.length})
                        </Label>
                        <div className="space-y-2">
                          {aiOptimization.recommendations.map((rec, index) => (
                            <Alert key={index}>
                              <div className="flex items-start gap-3">
                                <Badge
                                  variant={
                                    rec.impact === 'high'
                                      ? 'default'
                                      : rec.impact === 'medium'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                  className="mt-0.5"
                                >
                                  {rec.impact} impact
                                </Badge>
                                <div className="flex-1">
                                  <div className="font-semibold text-sm capitalize">
                                    {rec.type} - {rec.field}
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {rec.suggestion}
                                  </div>
                                </div>
                              </div>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiOptimization.bestPractices.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Best Practices Applied
                        </Label>
                        <ul className="space-y-1">
                          {aiOptimization.bestPractices.map((practice, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{practice}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button onClick={handleApplyAIOptimization} className="w-full">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Apply Optimizations
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Forms Tab */}
        <TabsContent value="forms" className="space-y-6">
          {forms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Forms Yet</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Create your first lead capture form to start collecting leads
                </p>
                <Button onClick={() => setActiveTab('builder')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Form
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {forms.map((form) => (
                <Card key={form.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {form.name}
                          <Badge variant={form.isActive ? 'default' : 'secondary'}>
                            {form.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </CardTitle>
                        {form.description && (
                          <CardDescription className="mt-2 line-clamp-2">
                            {form.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Fields</div>
                          <div className="font-semibold">{form.fields?.length || 0}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Submissions</div>
                          <div className="font-semibold">{form.submissionCount || 0}</div>
                        </div>
                      </div>

                      {form.conversionRate && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Conversion Rate
                          </div>
                          <div className="font-semibold text-green-600">
                            {form.conversionRate}%
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDuplicateForm(form.id)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteForm(form.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
