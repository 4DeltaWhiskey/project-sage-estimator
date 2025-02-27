
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface ProjectInputProps {
  projectDescription: string;
  onDescriptionChange: (description: string) => void;
  onGenerate: () => void;
  loading: boolean;
  loadingMessage: string;
}

export function ProjectInput({
  projectDescription,
  onDescriptionChange,
  onGenerate,
  loading,
  loadingMessage,
}: ProjectInputProps) {
  return (
    <Card className="p-8 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-500">
      <div className="space-y-6">
        <Textarea 
          placeholder="Describe your project in detail... (e.g., I want to build a task management application with user authentication, real-time updates, and team collaboration features)" 
          value={projectDescription} 
          onChange={e => onDescriptionChange(e.target.value)} 
          className="min-h-[200px] resize-none bg-white/50 dark:bg-black/50 backdrop-blur-md border-white/20 dark:border-white/10 rounded-xl placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:ring-violet-500/50 dark:focus-visible:ring-violet-400/50" 
        />
        <Button 
          onClick={onGenerate} 
          disabled={loading} 
          className="w-full group relative overflow-hidden bg-gradient-to-r from-rose-500 via-violet-500 to-teal-500 hover:from-rose-400 hover:via-violet-400 hover:to-teal-400 text-white rounded-xl py-6 transition-all duration-500 shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="animate-fade-in">{loadingMessage}</span>
            </div>
          ) : (
            "Generate Work Breakdown & Estimation"
          )}
        </Button>
      </div>
    </Card>
  );
}
