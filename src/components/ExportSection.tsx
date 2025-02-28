
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Github, CloudUpload, Loader2, Code } from "lucide-react";
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
import { BuildWithLovableModal } from "@/components/BuildWithLovableModal";

interface AzureProject {
  id: string;
  name: string;
}

interface AzureEpic {
  id: number;
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
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showEpicDialog, setShowEpicDialog] = useState(false);
  const [showLovableModal, setShowLovableModal] = useState(false);
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
  const [epics, setEpics] = useState<AzureEpic[]>([]);
  const [selectedEpic, setSelectedEpic] = useState<number | null>(null);
  const [createNewEpic, setCreateNewEpic] = useState(true);
  const [newEpicName, setNewEpicName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [iterations, setIterations] = useState<AzureIterationPath[]>([]);
  const [areas, setAreas] = useState<AzureAreaPath[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingEpics, setIsLoadingEpics] = useState(false);
  const [isLoadingPaths, setIsLoadingPaths] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);

  // Generate a meaningful epic name from the project description
  const generateEpicName = (description: string, features: UserStory[]) => {
    // First try to extract meaningful words from the project description
    if (description.trim()) {
      const words = description.split(/\s+/);
      if (words.length > 2) {
        // Take first few words from description
        const firstWords = words.slice(0, 5);
        return `${firstWords.join(' ')}...`;
      }
    }

    // If no description or it's too short, use feature names
    if (features && features.length > 0) {
      const featureNames = features.slice(0, 3).map(f => f.name.split(' ')[0]);
      return `Project: ${featureNames.join(', ')}...`;
    }

    // Fallback
    return "New Project";
  };

  // Generate acceptance criteria for a user story
  const generateAcceptanceCriteria = (userStory: string, featureName: string) => {
    // Extract action or main intent from user story
    let action = "implement functionality";
    
    // Common user story formats: "As a X, I want Y, so that Z"
    if (userStory.includes("I want")) {
      const match = userStory.match(/I want\s+(.+?)(?:,|\s+so\s+that|$)/i);
      if (match && match[1]) {
        action = match[1].trim();
      }
    }
    
    // Create standard acceptance criteria
    return `<div>
<h3>Acceptance Criteria:</h3>
<ul>
  <li>Given ${featureName} is active, when ${action}, then the system responds appropriately</li>
  <li>The UI elements meet the design guidelines and are responsive</li>
  <li>All form inputs include proper validation</li>
  <li>Error messages are clear and helpful</li>
  <li>Performance meets established benchmarks</li>
  <li>The functionality is accessible to all user types</li>
</ul>
<h3>Definition of Done:</h3>
<ul>
  <li>Code has been reviewed and approved</li>
  <li>Unit tests are written and passing</li>
  <li>Integration tests are written and passing</li>
  <li>Documentation has been updated</li>
  <li>The feature has been tested in a QA environment</li>
</ul>
</div>`;
  };

  // Get effort estimate for a user story based on feature estimation
  const calculateStoryEffort = (feature: UserStory, storyIndex: number, storyCount: number) => {
    if (!feature.estimation) {
      return 1; // Default to 1 hour if no estimation
    }
    
    // Distribute feature hours among stories, ensuring at least 1 hour per story
    const totalHours = feature.estimation.hours;
    const baseEffort = Math.max(1, Math.floor(totalHours / storyCount));
    
    // Add a little variance based on story position (first stories might be more complex)
    const position = storyIndex / storyCount;
    const variance = position < 0.3 ? 1 : position < 0.7 ? 0 : -0.5;
    
    return Math.max(1, Math.round(baseEffort + variance));
  };

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

    // Try to get the current project breakdown and description from local storage
    const storedBreakdown = localStorage.getItem('projectBreakdown');
    const storedDescription = localStorage.getItem('projectDescription');
    
    if (storedDescription) {
      setProjectDescription(storedDescription);
    }
    
    if (storedBreakdown) {
      try {
        const parsed = JSON.parse(storedBreakdown);
        setBreakdown(parsed);
        
        // Generate epic name based on project description and features
        if (parsed && parsed.features && parsed.features.length > 0) {
          const suggestedName = generateEpicName(storedDescription || "", parsed.features);
          setNewEpicName(suggestedName);
        }
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

  const handleBuildWithLovable = () => {
    if (!breakdown) {
      toast({
        title: "Project Required",
        description: "Please generate a project breakdown first.",
        variant: "destructive",
      });
      return;
    }
    
    setShowLovableModal(true);
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

  const fetchAzureEpics = async () => {
    if (!azureConfig.organization || !azureConfig.project || !azureConfig.pat) return;
    
    setIsLoadingEpics(true);
    try {
      const headers = new Headers();
      headers.append('Authorization', 'Basic ' + btoa(':' + azureConfig.pat));
      headers.append('Content-Type', 'application/json');
      headers.append('Accept', 'application/json');
      
      // Use WIQL to query for Epic type work items
      const wiqlQuery = {
        query: `SELECT [System.Id], [System.Title] FROM WorkItems WHERE [System.WorkItemType] = 'Epic' AND [System.TeamProject] = '${azureConfig.project}' ORDER BY [System.Title] ASC`
      };
      
      const wiqlResponse = await fetch(
        `https://dev.azure.com/${azureConfig.organization}/${azureConfig.project}/_apis/wit/wiql?api-version=7.0`,
        { 
          method: 'POST',
          headers,
          body: JSON.stringify(wiqlQuery)
        }
      );
      
      if (!wiqlResponse.ok) {
        const contentType = wiqlResponse.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') === -1) {
          console.warn('Server returned non-JSON response:', await wiqlResponse.text());
          // If not JSON, we'll assume there are no epics and return an empty list
          setEpics([]);
          return;
        }
        throw new Error(`Failed to fetch epics: ${wiqlResponse.statusText}`);
      }
      
      const wiqlData = await wiqlResponse.json();
      
      if (!wiqlData.workItems || wiqlData.workItems.length === 0) {
        // No epics found, return an empty list
        setEpics([]);
        return;
      }

      // Get detailed info for each epic
      const ids = wiqlData.workItems.map((item: any) => item.id).join(',');
      
      const detailsResponse = await fetch(
        `https://dev.azure.com/${azureConfig.organization}/${azureConfig.project}/_apis/wit/workitems?ids=${ids}&api-version=7.0`,
        { headers }
      );
      
      if (!detailsResponse.ok) {
        throw new Error(`Failed to fetch epic details: ${detailsResponse.statusText}`);
      }
      
      const detailsData = await detailsResponse.json();
      
      if (detailsData.value && detailsData.value.length > 0) {
        const fetchedEpics = detailsData.value.map((epic: any) => ({
          id: epic.id,
          name: epic.fields['System.Title']
        }));
        
        setEpics(fetchedEpics);
      } else {
        setEpics([]);
      }
    } catch (error: any) {
      console.error('Error fetching epics:', error);
      toast({
        title: "Error Fetching Epics",
        description: "Empty backlog is fine - you can create a new epic instead.",
        variant: "default",  // Changed from "info" to "default" to fix the type error
      });
      // Set epics to empty array to allow continuing even if there was an error
      setEpics([]);
    } finally {
      setIsLoadingEpics(false);
    }
  };

  const connectToAzure = async () => {
    if (!azureConfig.organization || !azureConfig.pat) {
      toast({
        title: "Missing Information",
        description: "Please provide both organization name and PAT token",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await fetchAzureProjects();
      setShowAzureDialog(false);
      setShowProjectDialog(true);
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Azure DevOps",
        variant: "destructive",
      });
    }
  };

  const selectProject = async () => {
    if (!azureConfig.project) {
      toast({
        title: "No Project Selected",
        description: "Please select a project to continue",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Save the current organization and project
      await saveAzureSettings();
      
      // Fetch epics for the selected project
      await fetchAzureEpics();
      
      setShowProjectDialog(false);
      setShowEpicDialog(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process project selection",
        variant: "destructive",
      });
    }
  };

  const saveAzureSettings = async () => {
    if (!session?.user || !azureConfig.organization) return;
    
    try {
      // Encrypt the PAT on the backend for security
      const { error: encryptError } = await supabase.functions.invoke('encrypt-azure-pat', {
        body: { 
          userId: session.user.id,
          pat: azureConfig.pat,
          organization: azureConfig.organization
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

  const createWorkItem = async (
    type: string, 
    title: string, 
    description: string, 
    parentId?: number,
    effortHours?: number,
    acceptanceCriteria?: string
  ): Promise<number> => {
    const headers = new Headers();
    headers.append('Authorization', 'Basic ' + btoa(':' + azureConfig.pat));
    headers.append('Content-Type', 'application/json-patch+json');
    
    // Prepare fields for the work item
    let fields: Array<{op: string, path: string, value: string | number | {rel: string, url: string}}> = [
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
    
    // Add effort field for User Story
    if (type === "User Story" && effortHours !== undefined) {
      fields.push({
        "op": "add",
        "path": "/fields/Microsoft.VSTS.Scheduling.Effort",
        "value": effortHours
      });
    }
    
    // Add acceptance criteria for User Story if provided
    if (type === "User Story" && acceptanceCriteria) {
      fields.push({
        "op": "add",
        "path": "/fields/Microsoft.VSTS.Common.AcceptanceCriteria",
        "value": acceptanceCriteria
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
        throw new Error(`Failed to set parent relationship: ${relationResponse.statusText}`);
      }
    }
    
    return newItemId;
  };

  const handleAzureExport = async () => {
    try {
      // Check if we have any features to export
      if (!breakdown || !breakdown.features || breakdown.features.length === 0) {
        throw new Error("No features to export. Please generate a project breakdown first.");
      }

      setIsExporting(true);
      toast({
        title: "Export Started",
        description: "Creating work items in Azure DevOps...",
      });

      // Determine epic ID to use
      let epicId: number;
      
      if (createNewEpic) {
        // Create a new epic with the provided name
        const epicTitle = newEpicName || "AI Requirements Engineer Export";
        epicId = await createWorkItem(
          "Epic", 
          epicTitle, 
          "Automatically generated project structure from AI Requirements Engineer"
        );
      } else if (selectedEpic) {
        // Use the selected existing epic
        epicId = selectedEpic;
      } else {
        throw new Error("Please select an epic or create a new one.");
      }

      // Track the creation progress
      let featuresCreated = 0;
      let storiesCreated = 0;
      const totalFeatures = breakdown.features.length;
      const totalStories = breakdown.features.reduce((sum, feature) => sum + feature.userStories.length, 0);

      // Create features and their user stories
      for (const feature of breakdown.features) {
        try {
          // Create feature as a Feature work item under the epic
          const featureId = await createWorkItem(
            "Feature", 
            feature.name, 
            feature.description,
            epicId // Set the epic as the parent for this feature
          );
          
          featuresCreated++;
          
          // Create user stories as User Story work items under the feature
          const storyCount = feature.userStories.length;
          
          for (let i = 0; i < storyCount; i++) {
            const userStory = feature.userStories[i];
            const storyEffort = calculateStoryEffort(feature, i, storyCount);
            const storyAcceptanceCriteria = generateAcceptanceCriteria(userStory, feature.name);
            
            await createWorkItem(
              "User Story",
              userStory,
              `Part of feature: ${feature.name}`,
              featureId, // Set the feature as the parent for this user story
              storyEffort, // Add effort estimation in hours
              storyAcceptanceCriteria // Add acceptance criteria
            );
            
            storiesCreated++;
          }
        } catch (error) {
          console.error(`Error creating feature "${feature.name}":`, error);
          // Continue with other features even if one fails
        }
      }

      toast({
        title: "Export Complete",
        description: `Created ${featuresCreated} features and ${storiesCreated} user stories in Azure DevOps`,
      });
      
      setShowEpicDialog(false);
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
          onClick={handleBuildWithLovable}
        >
          <Code className="h-8 w-8" />
          <span>Build with Lovable</span>
        </Button>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">
        Export your project breakdown and estimations in various formats for further planning and collaboration.
      </p>

      {/* Build with Lovable Modal */}
      <BuildWithLovableModal 
        open={showLovableModal}
        onOpenChange={setShowLovableModal}
        breakdown={breakdown}
        projectDescription={projectDescription}
      />

      {/* Initial Azure DevOps Connection Dialog */}
      <Dialog open={showAzureDialog} onOpenChange={setShowAzureDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect to Azure DevOps</DialogTitle>
            <DialogDescription>
              Enter your Azure DevOps organization and Personal Access Token (PAT).
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAzureDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={connectToAzure} 
              disabled={isLoadingProjects || !azureConfig.organization || !azureConfig.pat}
            >
              {isLoadingProjects ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Selection Dialog */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Azure DevOps Project</DialogTitle>
            <DialogDescription>
              Choose the project where you want to export your features and user stories.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Project Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">
                Project
              </Label>
              <div className="col-span-3 flex gap-2">
                <Select 
                  value={azureConfig.project} 
                  onValueChange={(value) => setAzureConfig(prev => ({ ...prev, project: value }))}
                  disabled={projects.length === 0}
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
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowProjectDialog(false);
              setShowAzureDialog(true);
            }}>
              Back
            </Button>
            <Button 
              onClick={selectProject} 
              disabled={!azureConfig.project}
            >
              Select Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Epic Selection Dialog */}
      <Dialog open={showEpicDialog} onOpenChange={setShowEpicDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Epic Selection</DialogTitle>
            <DialogDescription>
              Choose to create a new epic or use an existing epic.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Button
                variant={createNewEpic ? "default" : "outline"}
                onClick={() => setCreateNewEpic(true)}
                className="flex-1"
              >
                Create New Epic
              </Button>
              <Button
                variant={!createNewEpic ? "default" : "outline"}
                onClick={() => setCreateNewEpic(false)}
                disabled={epics.length === 0}
                className="flex-1"
                title={epics.length === 0 ? "No existing epics found" : ""}
              >
                Use Existing Epic
              </Button>
            </div>

            {createNewEpic ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="epicName" className="text-right">
                  Epic Name
                </Label>
                <Input
                  id="epicName"
                  placeholder="New Epic Name"
                  value={newEpicName}
                  onChange={(e) => setNewEpicName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            ) : (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="existingEpic" className="text-right">
                  Existing Epic
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Select 
                    value={selectedEpic?.toString() || ""} 
                    onValueChange={(value) => setSelectedEpic(parseInt(value))}
                    disabled={epics.length === 0 || isLoadingEpics}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={epics.length === 0 ? "No epics available" : "Select epic"} />
                    </SelectTrigger>
                    <SelectContent>
                      {epics.length === 0 ? (
                        <SelectItem value="" disabled>No epics found</SelectItem>
                      ) : (
                        epics.map((epic) => (
                          <SelectItem key={epic.id} value={epic.id.toString()}>
                            {epic.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {isLoadingEpics && <Loader2 className="h-5 w-5 animate-spin" />}
                </div>
              </div>
            )}
            
            {epics.length === 0 && !createNewEpic && (
              <div className="text-amber-500 text-sm">
                No existing epics found in the project. You can create a new one instead.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEpicDialog(false);
              setShowProjectDialog(true);
            }}>
              Back
            </Button>
            <Button 
              onClick={handleAzureExport} 
              disabled={isExporting || (createNewEpic ? !newEpicName : !selectedEpic)}
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
