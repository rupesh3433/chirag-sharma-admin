import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Knowledge } from '@/types';
import { Edit, Trash2, FileText, Globe } from 'lucide-react';

type Props = {
  data: Knowledge[];
  onEdit: (knowledge: Knowledge) => void;
  onDelete: (id: string) => void;
};

const KnowledgeTable = ({ data, onEdit, onDelete }: Props) => {
  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12 bg-card rounded-lg border">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No knowledge base entries found.</p>
        <p className="text-xs mt-1">Create one to get started!</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Language</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item._id} className="border-t hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{item.title}</td>

                <td className="px-4 py-3">
                  <span className="uppercase text-xs text-muted-foreground font-medium">
                    {item.language}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <Badge
                    variant={item.is_active ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>

                <td className="px-4 py-3 text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(item._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((item) => (
          <div
            key={item._id}
            className="bg-card rounded-lg border p-4 space-y-3 hover:border-primary/50 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm truncate">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase">
                      {item.language}
                    </span>
                  </div>
                </div>
              </div>
              <Badge
                variant={item.is_active ? 'default' : 'secondary'}
                className="text-xs flex-shrink-0"
              >
                {item.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Content Preview */}
            <div className="bg-muted/30 rounded-md p-2">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.content || 'No content'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                onClick={() => onEdit(item)}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive h-9"
                onClick={() => onDelete(item._id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default KnowledgeTable;