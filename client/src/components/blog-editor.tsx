import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);
import { useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  ImageIcon,
  Link as LinkIcon,
  Code2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BlogEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onSave?: () => void;
  onPreview?: () => void;
  autoSave?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  characterLimit?: number;
}

/**
 * Rich Text Blog Editor Component
 *
 * Full-featured blog editor with TipTap, supporting:
 * - Rich text formatting
 * - Headings (H1-H3)
 * - Lists (ordered/unordered)
 * - Links and images
 * - Code blocks with syntax highlighting
 * - Character count
 * - Auto-save
 * - Preview mode
 *
 * @param content - Initial HTML content
 * @param onChange - Callback when content changes
 * @param onSave - Callback for manual save
 * @param onPreview - Callback for preview mode
 * @param autoSave - Enable auto-save (default: true)
 * @param readOnly - Read-only mode (default: false)
 * @param placeholder - Editor placeholder text
 * @param characterLimit - Max character count (default: 50000)
 */
export default function BlogEditor({
  content = '',
  onChange,
  onSave,
  onPreview,
  autoSave = true,
  readOnly = false,
  placeholder = 'Start writing your blog post...',
  characterLimit = 50000,
}: BlogEditorProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use code-block-lowlight instead
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'rounded-lg bg-gray-900 text-gray-100 p-4 my-4 overflow-x-auto',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: characterLimit,
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) {
        onChange(html);
      }

      // Auto-save logic
      if (autoSave && onSave) {
        handleAutoSave();
      }
    },
  });

  const handleAutoSave = () => {
    setIsSaving(true);
    // Debounce auto-save
    setTimeout(() => {
      if (onSave) {
        onSave();
      }
      setLastSaved(new Date());
      setIsSaving(false);
    }, 2000);
  };

  const handleAddImage = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setImageDialogOpen(false);
    }
  };

  const handleAddLink = () => {
    if (linkUrl && editor) {
      if (linkText) {
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${linkUrl}">${linkText}</a>`)
          .run();
      } else {
        editor.chain().focus().setLink({ href: linkUrl }).run();
      }
      setLinkUrl('');
      setLinkText('');
      setLinkDialogOpen(false);
    }
  };

  if (!editor) {
    return null;
  }

  const characterCount = editor.storage.characterCount.characters();
  const wordCount = editor.storage.characterCount.words();

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      {!readOnly && (
        <div className="border-b border-gray-200 bg-gray-50 p-2">
          <div className="flex flex-wrap items-center gap-1">
            {/* Text Formatting */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'bg-gray-200' : ''}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'bg-gray-200' : ''}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive('strike') ? 'bg-gray-200' : ''}
              >
                <Strikethrough className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={editor.isActive('code') ? 'bg-gray-200' : ''}
              >
                <Code className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Headings */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
              >
                <Heading1 className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
              >
                <Heading2 className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}
              >
                <Heading3 className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Lists */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
              >
                <Quote className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={editor.isActive('codeBlock') ? 'bg-gray-200' : ''}
              >
                <Code2 className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Media & Links */}
            <div className="flex items-center gap-1">
              <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm">
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Insert Image</DialogTitle>
                    <DialogDescription>
                      Enter the URL of the image you want to insert
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="image-url">Image URL</Label>
                      <Input
                        id="image-url"
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddImage}>Insert Image</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm">
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Insert Link</DialogTitle>
                    <DialogDescription>
                      Enter the URL and optional text for the link
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="link-url">URL</Label>
                      <Input
                        id="link-url"
                        placeholder="https://example.com"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="link-text">Link Text (Optional)</Label>
                      <Input
                        id="link-text"
                        placeholder="Click here"
                        value={linkText}
                        onChange={(e) => setLinkText(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddLink}>Insert Link</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Save Status */}
              {autoSave && (
                <span className="text-xs text-gray-500">
                  {isSaving ? (
                    'Saving...'
                  ) : lastSaved ? (
                    `Saved ${formatTimeAgo(lastSaved)}`
                  ) : (
                    'Not saved'
                  )}
                </span>
              )}

              {/* Manual Save */}
              {onSave && !autoSave && (
                <Button type="button" size="sm" onClick={onSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}

              {/* Preview */}
              {onPreview && (
                <Button type="button" variant="outline" size="sm" onClick={onPreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="p-6 min-h-[500px] prose prose-lg max-w-none">
        <EditorContent editor={editor} />
      </div>

      {/* Footer Stats */}
      {!readOnly && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>{wordCount} words</span>
              <span>
                {characterCount} / {characterLimit} characters
              </span>
              <span>
                ~{Math.ceil(wordCount / 200)} min read
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bubble Menu and Floating Menu temporarily disabled due to import issues */}
      {/* TODO: Re-enable once @tiptap/extension-bubble-menu and @tiptap/extension-floating-menu are installed */}
    </div>
  );
}

// Helper function
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
