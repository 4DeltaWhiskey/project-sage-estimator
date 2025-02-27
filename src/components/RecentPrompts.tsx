
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecentPromptsProps {
  prompts: { id: string; description: string; created_at: string }[];
  onSelectPrompt: (description: string) => void;
}

export function RecentPrompts({ prompts, onSelectPrompt }: RecentPromptsProps) {
  if (prompts.length === 0) return null;

  return (
    <Card className="p-6 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl">
      <h3 className="text-lg font-semibold mb-4 text-violet-600 dark:text-violet-400">Recent Prompts</h3>
      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {prompts.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => onSelectPrompt(prompt.description)}
              className="w-full text-left p-3 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-sm"
            >
              {prompt.description.length > 100
                ? `${prompt.description.slice(0, 100)}...`
                : prompt.description}
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
