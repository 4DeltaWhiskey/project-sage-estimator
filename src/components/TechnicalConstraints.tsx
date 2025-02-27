
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Pencil, Save } from "lucide-react";
import { LoadingDialog } from "@/components/LoadingDialog";

interface TechnicalConstraintsProps {
  technicalComponents: string[];
  onSave: (components: string[]) => void;
}

export function TechnicalConstraints({ technicalComponents, onSave }: TechnicalConstraintsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedComponents, setEditedComponents] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    const components = editedComponents
      .split('\n')
      .filter(tech => tech.trim());
    await onSave(components);
    setIsEditing(false);
    setIsLoading(false);
  };

  return (
    <div className="mt-6 bg-black/5 dark:bg-white/5 rounded-xl p-6 space-y-4">
      <LoadingDialog open={isLoading} />
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-semibold text-violet-600 dark:text-violet-400 m-0">
          Technical Constraints
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsEditing(true);
            setEditedComponents(technicalComponents.join('\n'));
          }}
          className="text-violet-600 dark:text-violet-400"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Refine
        </Button>
      </div>
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-violet-600 dark:text-violet-400 block mb-2">
              Technical Components (one per line)
            </label>
            <Textarea
              value={editedComponents}
              onChange={(e) => setEditedComponents(e.target.value)}
              className="w-full min-h-[200px]"
              placeholder="Enter technical components, one per line"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setEditedComponents('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <ul className="list-none p-0 m-0 space-y-2">
          {technicalComponents.map((tech, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 mt-1 text-violet-500" />
              {tech}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
