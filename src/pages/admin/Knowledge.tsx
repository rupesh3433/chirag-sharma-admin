import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Knowledge } from '@/types';
import { knowledgeApi } from '@/services/api';
import KnowledgeTable from '@/components/knowledge/KnowledgeTable';
import KnowledgeEditor from '@/components/knowledge/KnowledgeEditor';
import { Plus, Upload } from 'lucide-react';

const KnowledgePage = () => {
  const { toast } = useToast();

  const [data, setData] = useState<Knowledge[]>([]);
  const [editing, setEditing] = useState<Knowledge | null>(null);
  const [creating, setCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const load = async () => {
    try {
      const res = await knowledgeApi.getAll();
      setData(res.data);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load knowledge base',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* MULTIPLE TXT UPLOAD */
  const handleMultipleUpload = async (files: FileList) => {
    if (files.length === 0) return;

    const confirmUpload = confirm(
      `Upload ${files.length} knowledge file(s)?`
    );
    if (!confirmUpload) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const content = await file.text();

        await knowledgeApi.create({
          title: file.name.replace('.txt', ''),
          content,
          language: 'en',
          is_active: true,
        });
      }

      toast({
        title: 'Upload successful',
        description: `${files.length} file(s) added`,
      });

      load();
    } catch {
      toast({
        title: 'Upload failed',
        description: 'One or more files could not be uploaded',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Knowledge Base</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {data.length} {data.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => setCreating(true)} 
            className="flex-1 sm:flex-none"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create Knowledge</span>
            <span className="sm:hidden">Create</span>
          </Button>

          <label className="flex-1 sm:flex-none">
            <input
              type="file"
              accept=".txt"
              multiple
              hidden
              onChange={(e) =>
                e.target.files && handleMultipleUpload(e.target.files)
              }
            />
            <Button 
              variant="outline" 
              asChild 
              size="sm"
              disabled={isUploading}
            >
              <span className="flex items-center justify-center">
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : (
                  <>
                    <span className="hidden sm:inline">Upload .txt</span>
                    <span className="sm:hidden">Upload</span>
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Table */}
      <KnowledgeTable
        data={data}
        onEdit={(k) => setEditing(k)}
        onDelete={async (id) => {
          if (!confirm('Delete this knowledge?')) return;
          try {
            await knowledgeApi.delete(id);
            toast({ title: 'Deleted successfully' });
            load();
          } catch {
            toast({
              title: 'Error',
              description: 'Failed to delete',
              variant: 'destructive',
            });
          }
        }}
      />

      {/* Full-screen editor */}
      {(creating || editing) && (
        <KnowledgeEditor
          initialData={editing}
          onSave={async (payload) => {
            if (editing) {
              await knowledgeApi.update(editing._id, payload);
            } else {
              await knowledgeApi.create(payload);
            }
            setEditing(null);
            setCreating(false);
            load();
          }}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
};

export default KnowledgePage;