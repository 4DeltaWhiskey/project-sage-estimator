
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { LogOut, LogIn } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProjectSummary } from "@/components/ProjectSummary";
import { TechnicalConstraints } from "@/components/TechnicalConstraints";
import { Feature } from "@/components/Feature";
import { AuthDialog } from "@/components/AuthDialog";
import { RecentPrompts } from "@/components/RecentPrompts";
import { ProjectInput } from "@/components/ProjectInput";
import { ConsultationSection } from "@/components/ConsultationSection";
import { ExportSection } from "@/components/ExportSection";
import { Breakdown, UserStory } from "@/types/project";

const loadingMessages = [
  "🤔 Consulting with our AI experts...",
  "🎲 Rolling dice to determine project complexity...",
  "🔮 Gazing into our crystal ball for accurate estimates...",
  "🧮 Teaching our abacus quantum computing...",
  "🤖 Negotiating with the AI about working hours...",
  "🎯 Calculating precision with a banana for scale...",
  "📊 Converting coffee cups to code quality...",
  "🎪 Juggling features and deadlines...",
  "🎭 Performing interpretive dance to understand requirements...",
  "🎪 Training monkeys to write clean code...",
  "🎨 Painting your requirements in abstract art...",
  "🎮 Debugging with a rubber duck committee...",
  "🌟 Consulting the programming zodiac signs...",
  "🎓 Sending AI to coding boot camp...",
  "🎭 Rehearsing the code's Shakespeare monologue...",
  "🎪 Teaching elephants to write unit tests...",
  "🎯 Measuring complexity in unicorn points...",
  "🎲 Playing rock, paper, scissors with bugs...",
  "🎨 Color-coding your requirements in rainbow...",
  "🎭 Hosting a ted talk for your code snippets...",
  "🤖 Running code through our quantum toaster...",
  "🎪 Teaching cats to review pull requests...",
  "🎯 Calculating estimates in dog years...",
  "🎲 Consulting with our team of AI philosophers...",
  "🎨 Drawing blueprints with digital crayons...",
  "🎭 Performing code poetry slam...",
  "🎪 Training pigeons for cloud computing...",
  "🔮 Reading your code's fortune cookies...",
  "🎯 Measuring features in smiles per hour...",
  "🤖 Running standup meeting with robot comedians..."
];

const Index = () => {
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [session, setSession] = useState<any>(null);
  const [recentPrompts, setRecentPrompts] = useState<{ id: string; description: string; created_at: string; artifact_path?: string; }[]>([]);
  const [authDialog, setAuthDialog] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [editingFeature, setEditingFeature] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<{
    name: string;
    description: string;
    userStories: string;
  } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
      setLoadingMessageIndex(0);
    };
  }, [loading]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchRecentPrompts();
    }
  }, [session]);

  // Store breakdown in localStorage whenever it changes
  useEffect(() => {
    if (breakdown) {
      localStorage.setItem('projectBreakdown', JSON.stringify(breakdown));
    }
  }, [breakdown]);

  // Store project description in localStorage whenever it changes
  useEffect(() => {
    if (projectDescription) {
      localStorage.setItem('projectDescription', projectDescription);
    }
  }, [projectDescription]);

  const fetchRecentPrompts = async () => {
    const { data, error } = await supabase
      .from('user_prompts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent prompts:', error);
      return;
    }

    setRecentPrompts(data);
  };

  const savePromptAndArtifacts = async (description: string, projectBreakdown: Breakdown) => {
    if (!session?.user) return null;

    try {
      // Generate a unique filename for the artifact
      const timestamp = new Date().toISOString();
      const artifactPath = `${session.user.id}/${timestamp}_breakdown.json`;
      
      // Upload the breakdown as a JSON file to storage
      const { error: uploadError } = await supabase.storage
        .from('project_artifacts')
        .upload(artifactPath, JSON.stringify(projectBreakdown), {
          contentType: 'application/json',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading artifact:', uploadError);
        toast({
          title: "Storage Error",
          description: "Failed to save your project artifacts.",
          variant: "destructive",
        });
        return null;
      }

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('project_artifacts')
        .getPublicUrl(artifactPath);

      // Save the prompt with a reference to the uploaded artifact
      const { data: promptData, error: promptError } = await supabase
        .from('user_prompts')
        .insert([{ 
          description, 
          user_id: session.user.id,
          artifact_path: artifactPath
        }]);

      if (promptError) {
        console.error('Error saving prompt:', promptError);
        toast({
          title: "Database Error",
          description: "Your prompt was saved but failed to link with artifacts.",
          variant: "destructive",
        });
        return null;
      }

      await fetchRecentPrompts();
      return artifactPath;
    } catch (error) {
      console.error('Error in savePromptAndArtifacts:', error);
      return null;
    }
  };

  const loadArtifactFromPrompt = async (promptId: string, artifactPath?: string) => {
    if (!session?.user || !artifactPath) return;

    try {
      // Download the artifact file
      const { data, error } = await supabase.storage
        .from('project_artifacts')
        .download(artifactPath);

      if (error) {
        console.error('Error downloading artifact:', error);
        toast({
          title: "Error",
          description: "Failed to load the saved project data.",
          variant: "destructive",
        });
        return;
      }

      // Parse the JSON data from the file
      const jsonText = await data.text();
      const breakdownData: Breakdown = JSON.parse(jsonText);
      
      // Set the breakdown state
      setBreakdown(breakdownData);
      
      toast({
        title: "Project Loaded",
        description: "Your saved project data has been loaded successfully.",
      });
    } catch (error) {
      console.error('Error parsing artifact data:', error);
      toast({
        title: "Error",
        description: "The project data couldn't be loaded properly.",
        variant: "destructive",
      });
    }
  };

  const handleSelectPrompt = async (description: string, promptId?: string, artifactPath?: string) => {
    setProjectDescription(description);
    
    // If there's an artifact path, load the saved breakdown
    if (promptId && artifactPath) {
      await loadArtifactFromPrompt(promptId, artifactPath);
    }
  };

  const handleTechnicalComponentsSave = async (components: string[]) => {
    if (!breakdown) return;
    
    const { data: estimationResponse, error: estimationError } = await supabase.functions.invoke('generate-estimate', {
      body: {
        description: projectDescription,
        breakdown: { 
          features: breakdown.features.map(({ name, description, userStories }) => ({
            name,
            description,
            userStories
          })),
          technicalComponents: components 
        },
        hourlyRate: 50
      }
    });

    console.log('Estimation response after technical update:', { data: estimationResponse, error: estimationError });

    if (estimationError || estimationResponse?.error) {
      throw new Error(estimationResponse?.error || estimationError.message || 'Failed to generate estimates');
    }

    if (!estimationResponse || !estimationResponse.estimations || !Array.isArray(estimationResponse.estimations)) {
      console.error('Invalid estimation response:', estimationResponse);
      throw new Error('Invalid estimation format');
    }

    const updatedBreakdown: Breakdown = {
      features: breakdown.features.map((feature, i) => ({
        ...feature,
        estimation: estimationResponse.estimations[i]
      })),
      technicalComponents: components
    };

    console.log('Updated breakdown with new estimations:', updatedBreakdown);
    
    setBreakdown(updatedBreakdown);

    // Save the updated breakdown to storage if user is logged in
    if (session?.user) {
      await savePromptAndArtifacts(projectDescription, updatedBreakdown);
    }

    toast({
      title: "Project Updated",
      description: "Technical constraints and estimations have been recalculated.",
    });
  };

  const handleFeatureEdit = (index: number, feature: UserStory) => {
    setEditingFeature(index);
    setEditedContent({
      name: feature.name,
      description: feature.description,
      userStories: feature.userStories.join('\n')
    });
  };

  const handleFeatureSave = async (index: number) => {
    if (!editedContent || !breakdown) return;

    const updatedFeatures = [...breakdown.features];
    updatedFeatures[index] = {
      ...updatedFeatures[index],
      name: editedContent.name,
      description: editedContent.description,
      userStories: editedContent.userStories.split('\n').filter(story => story.trim())
    };

    try {
      const { data: estimationData, error: estimationError } = await supabase.functions.invoke('generate-estimate', {
        body: {
          description: projectDescription,
          breakdown: { 
            features: updatedFeatures,
            technicalComponents: breakdown.technicalComponents 
          },
          hourlyRate: 50
        }
      });

      if (estimationError) throw estimationError;

      const updatedBreakdown = {
        features: updatedFeatures.map((feature, i) => ({
          ...feature,
          estimation: estimationData.estimations[i]
        })),
        technicalComponents: breakdown.technicalComponents
      };

      setBreakdown(updatedBreakdown);
      
      // Save the updated breakdown to storage if user is logged in
      if (session?.user) {
        await savePromptAndArtifacts(projectDescription, updatedBreakdown);
      }
      
      setEditingFeature(null);
      setEditedContent(null);

      toast({
        title: "Feature Updated",
        description: "The feature has been updated with new estimations.",
      });
    } catch (error) {
      console.error('Error updating feature:', error);
      toast({
        title: "Error",
        description: "Failed to update feature. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFeatureEditChange = (field: string, value: string) => {
    setEditedContent(prev => prev ? { ...prev, [field]: value } : null);
  };

  const generateBreakdown = async () => {
    if (!projectDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please provide a project description to generate a breakdown.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: breakdownResponse, error: breakdownError } = await supabase.functions.invoke('generate-breakdown', {
        body: { description: projectDescription }
      });

      console.log('Breakdown response:', { data: breakdownResponse, error: breakdownError });

      if (breakdownError || breakdownResponse?.error) {
        throw new Error(breakdownResponse?.error || breakdownError.message || 'Failed to generate project breakdown');
      }

      if (!breakdownResponse || !breakdownResponse.features || !Array.isArray(breakdownResponse.features)) {
        console.error('Invalid breakdown response:', breakdownResponse);
        throw new Error('Invalid project breakdown format');
      }

      const { data: estimationResponse, error: estimationError } = await supabase.functions.invoke('generate-estimate', {
        body: {
          description: projectDescription,
          breakdown: breakdownResponse,
          hourlyRate: 50
        }
      });

      console.log('Estimation response:', { data: estimationResponse, error: estimationError });

      if (estimationError || estimationResponse?.error) {
        throw new Error(estimationResponse?.error || estimationError.message || 'Failed to generate estimates');
      }

      if (!estimationResponse || !estimationResponse.estimations || !Array.isArray(estimationResponse.estimations)) {
        console.error('Invalid estimation response:', estimationResponse);
        throw new Error('Invalid estimation format');
      }

      const enhancedBreakdown: Breakdown = {
        features: breakdownResponse.features.map((feature: UserStory, index: number) => ({
          ...feature,
          estimation: estimationResponse.estimations[index]
        })),
        technicalComponents: breakdownResponse.technicalComponents || []
      };
      
      console.log('Enhanced breakdown:', enhancedBreakdown);
      
      setBreakdown(enhancedBreakdown);

      // Save to Supabase if user is logged in
      if (session?.user) {
        await savePromptAndArtifacts(projectDescription, enhancedBreakdown);
      }

      toast({
        title: "Success",
        description: "Project breakdown and estimations have been generated.",
      });
    } catch (error: any) {
      console.error('Error generating breakdown:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate breakdown. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (features: UserStory[]) => {
    return features.reduce((acc, feature) => {
      if (feature.estimation) {
        return {
          hours: acc.hours + feature.estimation.hours,
          cost: acc.cost + feature.estimation.cost
        };
      }
      return acc;
    }, { hours: 0, cost: 0 });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      if (isSignUp) {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your signup.",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
      }
      setAuthDialog(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-violet-100 to-teal-100 dark:from-rose-950/30 dark:via-violet-950/30 dark:to-teal-950/30">
      <div className="container mx-auto px-4 py-12 max-w-6xl relative">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl rounded-3xl" />
        
        <div className="relative space-y-6 text-center mb-12">
          <div className="flex items-center justify-center">
            <span className="px-4 py-1.5 text-sm font-medium bg-white/10 backdrop-blur-md rounded-full inline-block shadow-xl border border-white/20 hover:border-white/40 transition-colors">
              Beta Release
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={session ? handleLogout : () => setAuthDialog(true)}
              className="flex items-center gap-2 absolute right-0"
            >
              {session ? (
                <>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-rose-600 via-violet-600 to-teal-600 dark:from-rose-400 dark:via-violet-400 dark:to-teal-400 bg-clip-text text-transparent">
            AI Requirements Engineer
          </h1>
          <p className="text-zinc-600 dark:text-zinc-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Describe your software project, and let our AI generate a detailed work breakdown structure and estimation.
          </p>
        </div>

        <div className="relative space-y-8">
          {session && recentPrompts.length > 0 && (
            <RecentPrompts
              prompts={recentPrompts}
              onSelectPrompt={(description, id, artifactPath) => 
                handleSelectPrompt(description, id, artifactPath)}
            />
          )}

          <ProjectInput
            projectDescription={projectDescription}
            onDescriptionChange={setProjectDescription}
            onGenerate={generateBreakdown}
            loading={loading}
            loadingMessage={loadingMessages[loadingMessageIndex]}
          />

          {breakdown && (
            <div className="space-y-8 relative">
              <ProjectSummary features={breakdown.features} />

              <TechnicalConstraints
                technicalComponents={breakdown.technicalComponents}
                onSave={handleTechnicalComponentsSave}
              />

              {breakdown.features.map((feature, index) => (
                <Feature
                  key={index}
                  feature={feature}
                  isEditing={editingFeature === index}
                  editedContent={editedContent}
                  onStartEdit={() => handleFeatureEdit(index, feature)}
                  onCancelEdit={() => {
                    setEditingFeature(null);
                    setEditedContent(null);
                  }}
                  onSaveEdit={() => handleFeatureSave(index)}
                  onEditChange={handleFeatureEditChange}
                />
              ))}

              <ConsultationSection />
              <ExportSection />
            </div>
          )}
        </div>

        <AuthDialog
          isOpen={authDialog}
          onOpenChange={setAuthDialog}
          isSignUp={isSignUp}
          onSignUpToggle={() => setIsSignUp(!isSignUp)}
          email={email}
          onEmailChange={setEmail}
          password={password}
          onPasswordChange={setPassword}
          onSubmit={handleAuth}
          isLoading={authLoading}
        />
      </div>
    </div>
  );
};

export default Index;
