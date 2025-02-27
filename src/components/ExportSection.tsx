
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Github, CloudUpload, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserStory, Breakdown } from "@/types/project";

interface AzureProject {
  id: string;
  name: string;
}

interface AzureTeam {
  id: string;
  name: string;
}

interface AzureIterationPath {
  id: string;
  name: string;
  path: string;
}

interface AzureAreaPath {
  id: string;
  name: string;
  path: string;
}

interface AzureWorkItemRelation {
  rel: string;
  url: string;
}

export function ExportSection() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [showAzureDialog, setShowAzureDialog] = useState(false);
  const [azureConfig, setAzureConfig] = useState({
    organization: "",
    project: "",
    pat: "",
    teamId: "",
    iterationPath: "",
    areaPath: "",
  });
  const [projects, setProjects] = useState<AzureProject[]>([]);
  const [teams, setTeams] = useState<AzureTeam[]>([]);
  const [iterations, setIterations] = useState<AzureIterationPath[]>([]);
  const [areas, setAreas] = useState<AzureAreaPath[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingPaths, setIsLoadingPaths] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);

  // Check for session on component mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Try to get the current project breakdown from local storage
    const storedBreakdown = localStorage.getItem('projectBreakdown');
    if (storedBreakdown) {
      try {
        const parsed = JSON.parse(storedBreakdown);
        setBreakdown(parsed);
      } catch (error) {
        console.error('Failed to parse stored breakdown:', error);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  // Load Azure DevOps settings from Supabase when session is available
  useEffect(() => {
    const loadAzureSettings = async () => {
      if (!session?.user) return;
      
      try {
        // This is a type-safe way to query a table that might not be in the types yet
        const { data, error } = await supabase
          .from('user_azure_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (error) {
          console.error('Error loading Azure settings:', error);
          return;
        }
        
        if (data) {
          // Safely access properties that TypeScript might not recognize yet
          setAzureConfig(prev => ({
            ...prev,
            organization: data.organization || '',
            project: data.last_project || ''
          }));
          
          // If we have a stored PAT, try to load it
          if (data.encrypted_pat) {
            const storedPat = await getPAT();
            if (storedPat) {
              setAzureConfig(prev => ({
                ...prev,
                pat: storedPat
              }));
            }
          }
        }
      } catch (error) {
        console.error('Failed to load Azure settings:', error);
      }
    };
    
    loadAzureSettings();
  }, [session]);

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

  const fetchAzureProjects = async () => {
    if (!azureConfig.organization || !azureConfig.pat) return;
    
    setIsLoadingProjects(true);
    try {
      const headers = new Headers();
      headers.append('Authorization', 'Basic ' + btoa(':' + azureConfig.pat));
      
      const response = await fetch(
        `https://dev.azure.com/${azureConfig.organization}/_apis/projects?api-version=7.0`,
        { headers }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProjects(data.value.map((p: any) => ({ id: p.id, name: p.name })));
    } catch (error: any) {
      toast({
        title: "Error Fetching Projects",
        description: error.message || "Failed to load Azure DevOps projects",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const fetchTeams = async () => {
    if (!azureConfig.organization || !azureConfig.project || !azureConfig.pat) return;

    setIsLoadingTeams(true);
    try {
      const headers = new Headers();
      headers.append('Authorization', 'Basic ' + btoa(':' + azureConfig.pat));
      
      const response = await fetch(
        `https://dev.azure.com/${azureConfig.organization}/${azureConfig.project}/_apis/teams?api-version=7.0`,
        { headers }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTeams(data.value.map((t: any) => ({ id: t.id, name: t.name })));
    } catch (error: any) {
      toast({
        title: "Error Fetching Teams",
        description: error.message || "Failed to load teams for the selected project",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const fetchIterationsAndAreas = async () => {
    if (!azureConfig.organization || !azureConfig.project || !azureConfig.teamId || !azureConfig.pat) return;

    setIsLoadingPaths(true);
    try {
      const headers = new Headers();
      headers.append('Authorization', 'Basic ' + btoa(':' + azureConfig.pat));
      
      // Fetch iterations
      const iterationsResponse = await fetch(
        `https://dev.azure.com/${azureConfig.organization}/${azureConfig.project}/${azureConfig.teamId}/_apis/work/teamsettings/iterations?api-version=7.0`,
        { headers }
      );
      
      if (!iterationsResponse.ok) {
        throw new Error(`Failed to fetch iterations: ${iterationsResponse.statusText}`);
      }
      
      const iterationsData = await iterationsResponse.json();
      setIterations(iterationsData.value.map((i: any) => ({ 
        id: i.id, 
        name: i.name,
        path: i.path
      })));

      // Fetch areas
      const areasResponse = await fetch(
        `https://dev.azure.com/${azureConfig.organization}/${azureConfig.project}/${azureConfig.teamId}/_apis/work/teamsettings/teamfieldvalues?api-version=7.0`,
        { headers }
      );
      
      if (!areasResponse.ok) {
        throw new Error(`Failed to fetch areas: ${areasResponse.statusText}`);
      }
      
      const areasData = await areasResponse.json();
      if (areasData.values) {
        setAreas(areasData.values.map((a: any) => ({ 
          id: a.value, 
          name: a.value.split('\\').pop(),
          path: a.value
        })));
      }
    } catch (error: any) {
      toast({
        title: "Error Fetching Project Structure",
        description: error.message || "Failed to load project structure",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPaths(false);
    }
  };

  // Effect to fetch projects when organization and PAT are set
  useEffect(() => {
    if (azureConfig.organization && azureConfig.pat) {
      fetchAzureProjects();
    }
  }, [azureConfig.organization, azureConfig.pat]);

  // Effect to fetch teams when project is selected
  useEffect(() => {
    if (azureConfig.organization && azureConfig.project && azureConfig.pat) {
      fetchTeams();
      // Reset team selection when project changes
      setAzureConfig(prev => ({ ...prev, teamId: "" }));
    }
  }, [azureConfig.organization, azureConfig.project, azureConfig.pat]);

  // Effect to fetch iterations and areas when team is selected
  useEffect(() => {
    if (azureConfig.organization && azureConfig.project && azureConfig.teamId && azureConfig.pat) {
      fetchIterationsAndAreas();
      // Reset path selections when team changes
      setAzureConfig(prev => ({ ...prev, iterationPath: "", areaPath: "" }));
    }
  }, [azureConfig.organization, azureConfig.project, azureConfig.teamId, azureConfig.pat]);

  const saveAzureSettings = async () => {
    if (!session?.user || !azureConfig.organization) return;
    
    try {
      // Encrypt the PAT on the backend for security
      const { error: encryptError } = await supabase.functions.invoke('encrypt-azure-pat', {
        body: { 
          userId: session.user.id,
          pat: azureConfig.pat
        }
      });
      
      if (encryptError) {
        console.error('Failed to encrypt PAT:', encryptError);
        return;
      }
      
      // Save organization and last project used - use a type-safe approach with explicit casting
      const { error: saveError } = await supabase
        .rpc('upsert_azure_settings', {
          p_user_id: session.user.id,
          p_organization: azureConfig.organization,
          p_last_project: azureConfig.project || null
        } as any); // Use 'as any' to bypass TypeScript error until types are updated
      
      if (saveError) {
        console.error('Failed to save Azure settings:', saveError);
      }
    } catch (error) {
      console.error('Error saving Azure settings:', error);
    }
  };

  const getPAT = async () => {
    if (!session?.user) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('get-azure-pat', {
        body: { userId: session.user.id }
      });
      
      if (error) {
        console.error('Failed to get PAT:', error);
        return null;
      }
      
      return data?.pat || null;
    } catch (error) {
      console.error('Error getting PAT:', error);
      return null;
    }
  };

  const createWorkItem = async (type: string, title: string, description: string, parentId?: number): Promise<number> => {
    const headers = new Headers();
    headers.append('Authorization', 'Basic ' + btoa(':' + azureConfig.pat));
    headers.append('Content-Type', 'application/json-patch+json');
    
    // Prepare fields including area and iteration paths if specified
    let fields: Array<{op: string, path: string, value: string | {rel: string, url: string}}> = [
      {
        "op": "add",
        "path": "/fields/System.Title",
        "value": title
      },
      {
        "op": "add",
        "path": "/fields/System.Description",
        "value": description
      }
    ];
    
    // Add area path if specified
    if (azureConfig.areaPath) {
      fields.push({
        "op": "add",
        "path": "/fields/System.AreaPath",
        "value": azureConfig.areaPath
      });
    }
    
    // Add iteration path if specified
    if (azureConfig.iterationPath) {
      fields.push({
        "op": "add",
        "path": "/fields/System.IterationPath",
        "value": azureConfig.iterationPath
      });
    }
    
    // Create the work item first
    const response = await fetch(
      `https://dev.azure.com/${azureConfig.organization}/${azureConfig.project}/_apis/wit/workitems/$${type}?api-version=7.0`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(fields)
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create work item: ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    const newItemId = data.id;
    
    // If there's a parent ID, create the parent-child relationship in a separate call
    if (parentId) {
      const relationHeaders = new Headers();
      relationHeaders.append('Authorization', 'Basic ' + btoa(':' + azureConfig.pat));
      relationHeaders.append('Content-Type', 'application/json-patch+json');
      
      const relationFields = [
        {
          "op": "add",
          "path": "/relations/-",
          "value": {
            "rel": "System.LinkTypes.Hierarchy-Reverse",
            "url": `https://dev.azure.com/${azureConfig.organization}/${azureConfig.project}/_apis/wit/workItems/${parentId}`
          }
        }
      ];
      
      const relationResponse = await fetch(
        `https://dev.azure.com/${azureConfig.organization}/${azureConfig.project}/_apis/wit/workitems/${newItemId}?api-version=7.0`,
        {
          method: 'PATCH',
          headers: relationHeaders,
          body: JSON.stringify(relationFields)
        }
      );
      
      if (!relationResponse.ok) {
        const errorText = await relationResponse.text();
        console.warn(`Warning: Failed to set parent relationship: ${relationResponse.statusText} - ${errorText}`);
      }
    }
    
    return newItemId;
  };

  const handleAzureExport = async () => {
    try {
      // Validate inputs
      if (!azureConfig.organization || !azureConfig.project || !azureConfig.pat) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required connection fields",
          variant: "destructive",
        });
        return;
      }

      // Check if we have any features to export
      if (!breakdown || !breakdown.features || breakdown.features.length === 0) {
        throw new Error("No features to export. Please generate a project breakdown first.");
      }

      setIsExporting(true);
      toast({
        title: "Export Started",
        description: "Connecting to Azure DevOps...",
      });

      // Save Azure settings including encrypted PAT
      await saveAzureSettings();

      // Create a parent Epic for the whole project
      const epicId = await createWorkItem(
        "Epic", 
        "AI Requirements Engineer Export", 
        "Automatically generated project structure from AI Requirements Engineer"
      );

      // Create features and their user stories
      for (const feature of breakdown.features) {
        // Create feature as a Feature work item
        const featureId = await createWorkItem(
          "Feature", 
          feature.name, 
          feature.description,
          epicId
        );
        
        // Create user stories as User Story work items
        for (const userStory of feature.userStories) {
          await createWorkItem(
            "User Story",
            userStory,
            `Part of feature: ${feature.name}`,
            featureId
          );
        }
      }

      toast({
        title: "Export Complete",
        description: `${breakdown.features.length} features and their user stories have been exported to Azure DevOps`,
      });
      
      setShowAzureDialog(false);
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "An error occurred during export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
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
            {/* Organization Field */}
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
            
            {/* PAT Token Field */}
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
            
            {/* Project Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">
                Project
              </Label>
              <div className="col-span-3 flex gap-2">
                <Select 
                  value={azureConfig.project} 
                  onValueChange={(value) => setAzureConfig({ ...azureConfig, project: value })}
                  disabled={projects.length === 0 || isLoadingProjects}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isLoadingProjects && <Loader2 className="h-5 w-5 animate-spin" />}
              </div>
            </div>
            
            {/* Team Selection */}
            {azureConfig.project && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="team" className="text-right">
                  Team
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Select 
                    value={azureConfig.teamId} 
                    onValueChange={(value) => setAzureConfig({ ...azureConfig, teamId: value })}
                    disabled={teams.length === 0 || isLoadingTeams}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isLoadingTeams && <Loader2 className="h-5 w-5 animate-spin" />}
                </div>
              </div>
            )}
            
            {/* Iteration Path Selection */}
            {azureConfig.teamId && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="iteration" className="text-right">
                  Iteration
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Select 
                    value={azureConfig.iterationPath} 
                    onValueChange={(value) => setAzureConfig({ ...azureConfig, iterationPath: value })}
                    disabled={iterations.length === 0 || isLoadingPaths}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select iteration (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {iterations.map((iteration) => (
                        <SelectItem key={iteration.id} value={iteration.path}>
                          {iteration.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isLoadingPaths && <Loader2 className="h-5 w-5 animate-spin" />}
                </div>
              </div>
            )}
            
            {/* Area Path Selection */}
            {azureConfig.teamId && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="area" className="text-right">
                  Area Path
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Select 
                    value={azureConfig.areaPath} 
                    onValueChange={(value) => setAzureConfig({ ...azureConfig, areaPath: value })}
                    disabled={areas.length === 0 || isLoadingPaths}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select area path (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.path}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isLoadingPaths && <Loader2 className="h-5 w-5 animate-spin" />}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAzureDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAzureExport} 
              disabled={isExporting || !azureConfig.organization || !azureConfig.project || !azureConfig.pat}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                'Export'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
