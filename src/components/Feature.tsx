
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Clock, Info, Pencil, Save, CheckCircle2 } from "lucide-react";
import { UserStory } from "@/types/project";

interface FeatureProps {
  feature: UserStory;
  isEditing: boolean;
  editedContent: {
    name: string;
    description: string;
    userStories: string;
  } | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditChange: (field: string, value: string) => void;
}

export function Feature({
  feature,
  isEditing,
  editedContent,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditChange,
}: FeatureProps) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <Input
          value={editedContent?.name}
          onChange={(e) => onEditChange('name', e.target.value)}
          className="font-semibold text-xl w-full"
          placeholder="Feature name"
        />
        <Textarea
          value={editedContent?.description}
          onChange={(e) => onEditChange('description', e.target.value)}
          className="w-full"
          placeholder="Feature description"
        />
        <div>
          <label className="text-sm font-medium text-violet-600 dark:text-violet-400 block mb-2">
            User Stories (one per line)
          </label>
          <Textarea
            value={editedContent?.userStories}
            onChange={(e) => onEditChange('userStories', e.target.value)}
            className="w-full"
            placeholder="Enter user stories, one per line"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancelEdit}>
            Cancel
          </Button>
          <Button onClick={onSaveEdit}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-semibold text-rose-600 dark:text-rose-400 m-0">
          {feature.name}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartEdit}
            className="text-violet-600 dark:text-violet-400"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Refine
          </Button>
          {feature.estimation && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/20 px-3 py-1.5 rounded-full">
                    <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {feature.estimation.hours}h
                    </span>
                    <span className="text-sm font-medium text-emerald-600/70 dark:text-emerald-400/70">
                      ({feature.estimation.cost}€)
                    </span>
                    <Info className="h-4 w-4 text-emerald-600/50 dark:text-emerald-400/50" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{feature.estimation.details}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      <p className="text-zinc-600 dark:text-zinc-300 m-0">
        {feature.description}
      </p>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-violet-600 dark:text-violet-400 m-0">
          User Stories
        </h4>
        <ul className="list-none p-0 m-0 space-y-2">
          {feature.userStories.map((story, storyIndex) => (
            <li key={storyIndex} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 mt-1 text-emerald-500" />
              {story}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
