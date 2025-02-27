
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Github, CloudUpload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function ExportSection() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [showAzureDialog, setShowAzureDialog] = useState(false);
  const [azureConfig, setAzureConfig] = useState({
    organization: "",
    project: "",
    pat: "",
  });

  // Check for session on component mount
  useState(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  });

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

    if (type === 'Azure DevOps') {
      setShowAzureDialog(true);
      return;
    }

    toast({
      title: "Export Started",
      description: `Generating ${type} file...`,
    });
  };

  const handleAzureExport = async () => {
    try {
      // Validate inputs
      if (!azureConfig.organization || !azureConfig.project || !azureConfig.pat) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Export Started",
        description: "Connecting to Azure DevOps...",
      });

      // Mock export for now - would be replaced with actual Azure DevOps API call
      // This would typically be handled by a Supabase Edge Function
      setTimeout(() => {
        toast({
          title: "Export Complete",
          description: `Features and User Stories exported to ${azureConfig.organization}/${azureConfig.project}`,
        });
        setShowAzureDialog(false);
        // Reset the form
        setAzureConfig({
          organization: "",
          project: "",
          pat: "",
        });
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "An error occurred during export",
        variant: "destructive",
      });
    }
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
        >
          <FileSpreadsheet className="h-8 w-8" />
          <span>Export to Excel</span>
        </Button>

        <Button 
          variant="outline"
          className="h-auto py-6 flex flex-col items-center gap-3 bg-white/5 hover:bg-white/10 dark:bg-black/5 dark:hover:bg-black/10"
          onClick={() => handleExport('GitHub')}
        >
          <Github className="h-8 w-8" />
          <span>Export to GitHub</span>
        </Button>

        <Button 
          variant="outline"
          className="h-auto py-6 flex flex-col items-center gap-3 bg-white/5 hover:bg-white/10 dark:bg-black/5 dark:hover:bg-black/10"
          onClick={() => handleExport('Azure DevOps')}
        >
          <CloudUpload className="h-8 w-8" />
          <span>Export to Azure DevOps</span>
        </Button>

        <Button 
          variant="outline"
          className="h-auto py-6 flex flex-col items-center gap-3 bg-white/5 hover:bg-white/10 dark:bg-black/5 dark:hover:bg-black/10"
          onClick={() => handleExport('MS Project')}
        >
          <CloudUpload className="h-8 w-8" />
          <span>Export to MS Project</span>
        </Button>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">
        Export your project breakdown and estimations in various formats for further planning and collaboration.
      </p>

      {/* Azure DevOps Connection Dialog */}
      <Dialog open={showAzureDialog} onOpenChange={setShowAzureDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect to Azure DevOps</DialogTitle>
            <DialogDescription>
              Enter your Azure DevOps details to export features and user stories.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="organization" className="text-right">
                Organization
              </Label>
              <Input
                id="organization"
                placeholder="your-organization"
                value={azureConfig.organization}
                onChange={(e) => setAzureConfig({ ...azureConfig, organization: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">
                Project
              </Label>
              <Input
                id="project"
                placeholder="your-project"
                value={azureConfig.project}
                onChange={(e) => setAzureConfig({ ...azureConfig, project: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pat" className="text-right">
                PAT Token
              </Label>
              <Input
                id="pat"
                type="password"
                placeholder="Personal Access Token"
                value={azureConfig.pat}
                onChange={(e) => setAzureConfig({ ...azureConfig, pat: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAzureDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAzureExport}>
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
