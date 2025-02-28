
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Download } from "lucide-react";
import { useStore } from "@/store";
import { BuildWithLovableModal } from "@/components/BuildWithLovableModal";

export function ExportSection() {
  const { breakdown, projectDescription } = useStore();
  const [lovableModalOpen, setLovableModalOpen] = useState(false);

  const handleExportJSON = () => {
    if (!breakdown) return;

    const dataStr = JSON.stringify(breakdown, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = "project-breakdown.json";
    
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-4 rounded-lg border p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
      <h3 className="text-lg font-medium">Export Options</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Download your project breakdown or build with Lovable AI.
      </p>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={handleExportJSON}
          className="flex items-center gap-1.5"
          disabled={!breakdown}
        >
          <Download className="h-4 w-4" />
          Export as JSON
        </Button>
        
        <Button
          onClick={() => setLovableModalOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-1.5"
          disabled={!breakdown}
        >
          <Heart className="h-4 w-4 fill-current" />
          Build with Lovable
        </Button>
      </div>
      
      <BuildWithLovableModal
        open={lovableModalOpen}
        onOpenChange={setLovableModalOpen}
        breakdown={breakdown}
        projectDescription={projectDescription}
      />
    </div>
  );
}
