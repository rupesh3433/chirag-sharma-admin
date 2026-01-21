import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Knowledge } from '@/types';

type Props = {
  initialData?: Knowledge | null;
  onSave: (data: {
    title: string;
    content: string;
    language: 'en' | 'ne' | 'hi' | 'mr';
    is_active: boolean;
  }) => Promise<void>;
  onClose: () => void;
};

const KnowledgeEditor = ({ initialData, onSave, onClose }: Props) => {
  const { toast } = useToast();

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [language, setLanguage] = useState<
    'en' | 'ne' | 'hi' | 'mr'
  >(initialData?.language ?? 'en');
  const [isActive, setIsActive] = useState(
    initialData?.is_active ?? true
  );

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* 🔒 Lock background scroll */
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, []);

  /* ⌨️ Keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        requestClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Validation error',
        description: 'Title and content are required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title,
        content,
        language,
        is_active: isActive,
      });
      toast({ title: 'Saved successfully' });
      setDirty(false);
      onClose();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save knowledge',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const requestClose = () => {
    if (dirty) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  };

  /* 🧠 PORTAL RENDER */
  return createPortal(
    <>
      {/* ===== HARD BLOCKER (kills layout bleed) ===== */}
      <div className="fixed inset-0 bg-white z-[10000]" />

      {/* ===== FULLSCREEN EDITOR ===== */}
      <div className="fixed inset-0 z-[10001] flex flex-col bg-background">

        {/* TOP BAR */}
        <div className="h-14 border-b flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold">
            {initialData ? 'Edit Knowledge File' : 'Create Knowledge File'}
          </h2>

          {/* ❌ CLOSE BUTTON */}
          <button
            onClick={requestClose}
            className="
              w-11 h-11 flex items-center justify-center
              rounded-full
              bg-red-100 text-red-600
              hover:bg-red-600 hover:text-white
              transition
            "
            aria-label="Close editor"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* META BAR */}
        <div className="border-b px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
            />
          </div>

          <div>
            <Label>Language</Label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value as any);
                setDirty(true);
              }}
            >
              <option value="en">English</option>
              <option value="ne">Nepali</option>
              <option value="hi">Hindi</option>
              <option value="mr">Marathi</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <Switch
              checked={isActive}
              onCheckedChange={(v) => {
                setIsActive(v);
                setDirty(true);
              }}
            />
            <Label>Active</Label>
          </div>
        </div>

        {/* EDITOR AREA */}
        <textarea
          className="
            flex-1 w-full
            p-6
            font-mono text-sm
            outline-none resize-none
          "
          placeholder="Write your knowledge base content here..."
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setDirty(true);
          }}
        />

        {/* BOTTOM SAVE BAR */}
        <div className="h-14 border-t px-6 flex items-center justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save (Ctrl + S)'}
          </Button>
        </div>
      </div>

      {/* ===== UNSAVED CHANGES MODAL ===== */}
      {showConfirm && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold">
              Unsaved changes
            </h3>
            <p className="text-sm text-muted-foreground">
              You have unsaved changes. What would you like to do?
            </p>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  setShowConfirm(false);
                  onClose();
                }}
              >
                Discard
              </Button>

              <Button
                onClick={() => {
                  setShowConfirm(false);
                  handleSave();
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default KnowledgeEditor;
