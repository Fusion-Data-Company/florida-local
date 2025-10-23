/**
 * Email Campaign Builder Component
 *
 * Comprehensive email campaign creation and editing interface with:
 * - Campaign details form
 * - Rich text email editor (TipTap)
 * - Recipient/segment selection
 * - Scheduling options
 * - Preview modes
 * - Test sending
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Save,
  Calendar,
  Eye,
  TestTube,
  Users,
  Settings,
  Mail,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  ImageIcon,
  Undo,
  Redo,
  Monitor,
  Smartphone,
} from 'lucide-react';

const campaignSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  subject: z.string().min(1, 'Subject is required'),
  preheaderText: z.string().max(150).optional(),
  senderName: z.string().min(1, 'Sender name is required'),
  senderEmail: z.string().email('Invalid email'),
  targetSegmentId: z.string().optional(),
  scheduledAt: z.string().optional(),
  trackOpens: z.boolean(),
  trackClicks: z.boolean(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface EmailCampaignBuilderProps {
  campaignId?: string;
  businessId: string;
  onSave?: (campaignId: string) => void;
  onCancel?: () => void;
}

export function EmailCampaignBuilder({
  campaignId,
  businessId,
  onSave,
  onCancel,
}: EmailCampaignBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [htmlContent, setHtmlContent] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Form setup
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      subject: '',
      preheaderText: '',
      senderName: 'Florida Local Elite',
      senderEmail: 'noreply@floridalocalelite.com',
      trackOpens: true,
      trackClicks: true,
    },
  });

  // Rich text editor setup
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: 'color: #3B82F6; text-decoration: underline;',
        },
      }),
      Placeholder.configure({
        placeholder: 'Write your email content here...',
      }),
    ],
    content: htmlContent,
    onUpdate: ({ editor }) => {
      setHtmlContent(editor.getHTML());
    },
  });

  // Fetch existing campaign if editing
  const { data: existingCampaign, isLoading: isLoadingCampaign } = useQuery({
    queryKey: ['/api/marketing/campaigns', campaignId],
    enabled: !!campaignId,
  });

  // Fetch available segments
  const { data: segments = [] } = useQuery({
    queryKey: ['/api/marketing/segments', { businessId }],
  });

  // Load existing campaign data
  useEffect(() => {
    if (existingCampaign) {
      form.reset({
        name: existingCampaign.name,
        subject: existingCampaign.subject,
        preheaderText: existingCampaign.preheaderText || '',
        senderName: existingCampaign.senderName,
        senderEmail: existingCampaign.senderEmail,
        targetSegmentId: existingCampaign.targetSegmentId,
        trackOpens: existingCampaign.trackOpens,
        trackClicks: existingCampaign.trackClicks,
      });
      setHtmlContent(existingCampaign.content);
      editor?.commands.setContent(existingCampaign.content);
    }
  }, [existingCampaign, editor, form]);

  // Create/Update campaign mutation
  const saveCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = campaignId
        ? `/api/marketing/campaigns/${campaignId}`
        : '/api/marketing/campaigns';
      const method = campaignId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to save campaign');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
      toast({
        title: 'Success',
        description: `Campaign ${campaignId ? 'updated' : 'created'} successfully`,
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

  // Send test email mutation
  const sendTestMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!campaignId) throw new Error('Save campaign first');

      const res = await fetch(`/api/marketing/campaigns/${campaignId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to send test email');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Test Sent',
        description: `Test email sent to ${testEmail}`,
      });
      setShowTestDialog(false);
      setTestEmail('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle save
  const handleSave = async (status: 'draft' | 'scheduled' = 'draft') => {
    const formData = form.getValues();

    if (!htmlContent || htmlContent === '<p></p>') {
      toast({
        title: 'Error',
        description: 'Email content cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    const campaignData = {
      ...formData,
      businessId,
      type: 'email',
      content: htmlContent,
      plainTextContent: editor?.getText() || '',
      status,
    };

    await saveCampaignMutation.mutateAsync(campaignData);
    setIsSaving(false);
  };

  // Handle send test
  const handleSendTest = async () => {
    if (!testEmail) {
      toast({
        title: 'Error',
        description: 'Please enter a test email address',
        variant: 'destructive',
      });
      return;
    }

    // Save first if not saved
    if (!campaignId) {
      await handleSave('draft');
    }

    await sendTestMutation.mutateAsync(testEmail);
  };

  // Editor toolbar actions
  const EditorToolbar = () => (
    <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/30">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleBold().run()}
        className={editor?.isActive('bold') ? 'bg-muted' : ''}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        className={editor?.isActive('italic') ? 'bg-muted' : ''}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        className={editor?.isActive('bulletList') ? 'bg-muted' : ''}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        className={editor?.isActive('orderedList') ? 'bg-muted' : ''}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) {
            editor?.chain().focus().setLink({ href: url }).run();
          }
        }}
      >
        <Link2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          const url = window.prompt('Enter image URL:');
          if (url) {
            editor?.chain().focus().setImage({ src: url }).run();
          }
        }}
      >
        <ImageIcon className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().undo().run()}
        disabled={!editor?.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().redo().run()}
        disabled={!editor?.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );

  if (isLoadingCampaign) {
    return <div className="p-8 text-center">Loading campaign...</div>;
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {campaignId ? 'Edit Email Campaign' : 'Create Email Campaign'}
          </h1>
          <p className="text-muted-foreground">
            Design and send professional email campaigns to your audience
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('preview')}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" onClick={() => setShowTestDialog(true)}>
            <TestTube className="mr-2 h-4 w-4" />
            Send Test
          </Button>
          <Button onClick={() => handleSave('draft')} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">
            <Settings className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="content">
            <Mail className="mr-2 h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="recipients">
            <Users className="mr-2 h-4 w-4" />
            Recipients
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* DETAILS TAB */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Basic information about your email campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="Summer Sale 2025"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    {...form.register('subject')}
                    placeholder="Don't miss our summer sale!"
                  />
                  {form.formState.errors.subject && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.subject.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preheaderText">Preheader Text (Optional)</Label>
                <Input
                  id="preheaderText"
                  {...form.register('preheaderText')}
                  placeholder="This appears after the subject line..."
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground">
                  {form.watch('preheaderText')?.length || 0}/150 characters
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senderName">Sender Name *</Label>
                  <Input
                    id="senderName"
                    {...form.register('senderName')}
                    placeholder="Your Business Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderEmail">Sender Email *</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    {...form.register('senderEmail')}
                    placeholder="noreply@yourbusiness.com"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tracking Options</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Track Opens</Label>
                    <p className="text-sm text-muted-foreground">
                      Track when recipients open this email
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('trackOpens')}
                    onCheckedChange={(checked) => form.setValue('trackOpens', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Track Clicks</Label>
                    <p className="text-sm text-muted-foreground">
                      Track when recipients click links in this email
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('trackClicks')}
                    onCheckedChange={(checked) => form.setValue('trackClicks', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTENT TAB */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>
                Design your email using the rich text editor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <EditorToolbar />
                <div className="prose max-w-none p-4 min-h-[400px]">
                  <EditorContent editor={editor} />
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">💡 Pro Tips:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Keep your subject line under 50 characters for better open rates</li>
                  <li>• Use personalization tokens like {'{{firstName}}'} (coming soon)</li>
                  <li>• Include a clear call-to-action button</li>
                  <li>• Test your email on multiple devices before sending</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RECIPIENTS TAB */}
        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Recipients</CardTitle>
              <CardDescription>
                Choose who will receive this email campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetSegmentId">Target Segment (Optional)</Label>
                <Select
                  value={form.watch('targetSegmentId')}
                  onValueChange={(value) => form.setValue('targetSegmentId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Send to all customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Customers</SelectItem>
                    {segments.map((segment: any) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name} ({segment.memberCount} members)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select a segment to target specific groups, or leave empty to send to all
                </p>
              </div>

              {form.watch('targetSegmentId') && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Segment Preview</h4>
                  <p className="text-sm text-muted-foreground">
                    This campaign will be sent to members of the selected segment
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREVIEW TAB */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Preview</CardTitle>
                  <CardDescription>
                    See how your email will look to recipients
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div
                  className={`border rounded-lg bg-white shadow-lg transition-all ${
                    previewMode === 'desktop' ? 'w-full max-w-2xl' : 'w-[375px]'
                  }`}
                >
                  <div className="border-b p-4 bg-muted">
                    <div className="text-sm font-semibold">
                      From: {form.watch('senderName')} &lt;{form.watch('senderEmail')}&gt;
                    </div>
                    <div className="text-lg font-bold mt-1">{form.watch('subject')}</div>
                    {form.watch('preheaderText') && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {form.watch('preheaderText')}
                      </div>
                    )}
                  </div>
                  <div
                    className="p-6 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Email Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test version of this campaign to verify how it looks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Test Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendTest}
                disabled={sendTestMutation.isPending}
              >
                {sendTestMutation.isPending ? 'Sending...' : 'Send Test'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
