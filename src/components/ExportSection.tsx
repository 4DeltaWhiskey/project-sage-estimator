
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Github, CloudUpload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Breakdown, UserStory } from "@/types/project";

interface ExportSectionProps {
  breakdown: Breakdown;
  userStories: UserStory[];
  projectName: string;
  isExporting: boolean;
  setIsExporting: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ExportSection({ 
  breakdown, 
  userStories, 
  projectName, 
  isExporting, 
  setIsExporting 
}: ExportSectionProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleExport = (type: string) => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to export your project.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsExporting(true);
    toast({
      title: "Export Started",
      description: `Generating ${type} file...`,
    });
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "Export Complete",
        description: `Your project has been exported to ${type} successfully.`,
      });
    }, 2000);
  };

  return (
    <Card className="p-8 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom duration-700">
      <h3 className="text-2xl font-bold bg-gradient-to-r from-rose-600 via-violet-600 to-teal-600 dark:from-rose-400 dark:via-violet-400 dark:to-teal-400 bg-clip-text text-transparent mb-6">
        Export Project
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center gap-3 bg-white/5 hover:bg-white/10 dark:bg-black/5 dark:hover:bg-black/10"
          onClick={() => handleExport('Excel')}
          disabled={isExporting}
        >
          <FileSpreadsheet className="h-8 w-8" />
          <span>Export to Excel</span>
        </Button>

        <Button 
          variant="outline"
          className="h-auto py-6 flex flex-col items-center gap-3 bg-white/5 hover:bg-white/10 dark:bg-black/5 dark:hover:bg-black/10"
          onClick={() => handleExport('GitHub')}
          disabled={isExporting}
        >
          <Github className="h-8 w-8" />
          <span>Export to GitHub</span>
        </Button>

        <Button 
          variant="outline"
          className="h-auto py-6 flex flex-col items-center gap-3 bg-white/5 hover:bg-white/10 dark:bg-black/5 dark:hover:bg-black/10"
          onClick={() => handleExport('Azure DevOps')}
          disabled={isExporting}
        >
          <CloudUpload className="h-8 w-8" />
          <span>Export to Azure DevOps</span>
        </Button>

        <Button 
          variant="outline"
          className="h-auto py-6 flex flex-col items-center gap-3 bg-white/5 hover:bg-white/10 dark:bg-black/5 dark:hover:bg-black/10"
          onClick={() => handleExport('MS Project')}
          disabled={isExporting}
        >
          <CloudUpload className="h-8 w-8" />
          <span>Export to MS Project</span>
        </Button>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">
        Export your project breakdown and estimations in various formats for further planning and collaboration.
      </p>
    </Card>
  );
}
