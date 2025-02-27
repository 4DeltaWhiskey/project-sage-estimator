import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, LogOut, LogIn } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProjectSummary } from "@/components/ProjectSummary";
import { TechnicalConstraints } from "@/components/TechnicalConstraints";
import { Feature } from "@/components/Feature";
import { AuthDialog } from "@/components/AuthDialog";
import { Breakdown, UserStory } from "@/types/project";

const loadingMessages = [
  "🤔 Consulting with our AI hamsters...",
  "🎲 Rolling dice to determine project complexity...",
  "🔮 Gazing into our crystal ball for accurate estimates...",
  "🧮 Teaching our abacus quantum computing...",
  "🤖 Negotiating with the AI about working hours...",
  "🎯 Calculating precision with a banana for scale...",
  "📊 Converting coffee cups to code quality...",
  "🎪 Juggling features and deadlines...",
  "🎭 Performing interpretive dance to understand requirements...",
  "🎪 Training monkeys to write clean code..."
];

const Index = () => {
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [session, setSession] = useState<any>(null);
  const [recentPrompts, setRecentPrompts] = useState<{ id: string; description: string; created_at: string; }[]>([]);
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

  const savePrompt = async (description: string) => {
    if (!session?.user) return;

    const { error } = await supabase
      .from('user_prompts')
      .insert([{ description, user_id: session.user.id }]);

    if (error) {
      console.error('Error saving prompt:', error);
      return;
    }

    await fetchRecentPrompts();
  };

  const handleTechnicalComponentsSave = async (components: string[]) => {
    try {
      toast({
        title: "Updating Project",
        description: "Recalculating project breakdown and estimations...",
      });

      const { data: estimationData, error: estimationError } = await supabase.functions.invoke('generate-estimate', {
        body: {
          description: projectDescription,
          breakdown: { 
            features: breakdown!.features,
            technicalComponents: components 
          },
          hourlyRate: 50
        }
      });

      if (estimationError) throw estimationError;

      setBreakdown({
        features: breakdown!.features.map((feature, i) => ({
          ...feature,
          estimation: estimationData.estimations[i]
        })),
        technicalComponents: components
      });

      toast({
        title: "Project Updated",
        description: "Technical constraints and estimations have been updated.",
      });
    } catch (error) {
      console.error('Error updating technical constraints:', error);
      toast({
        title: "Error",
        description: "Failed to update technical constraints. Please try again.",
        variant: "destructive",
      });
    }
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

      setBreakdown({
        features: updatedFeatures.map((feature, i) => ({
          ...feature,
          estimation: estimationData.estimations[i]
        })),
        technicalComponents: breakdown.technicalComponents
      });
      
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
      if (session?.user) {
        await savePrompt(projectDescription);
      }

      const {
        data,
        error
      } = await supabase.functions.invoke('generate-breakdown', {
        body: {
          description: projectDescription
        }
      });
      if (error) throw error;

      const {
        data: estimationData,
        error: estimationError
      } = await supabase.functions.invoke('generate-estimate', {
        body: {
          description: projectDescription,
          breakdown: data,
          hourlyRate: 50
        }
      });
      if (estimationError) throw estimationError;

      const enhancedBreakdown: Breakdown = {
        features: data.features.map((feature: UserStory, index: number) => ({
          ...feature,
          estimation: estimationData.estimations[index]
        })),
        technicalComponents: data.technicalComponents || []
      };
      
      setBreakdown(enhancedBreakdown);
      toast({
        title: "Breakdown Generated",
        description: "Project breakdown and estimations have been generated."
      });
    } catch (error) {
      console.error('Error generating breakdown:', error);
      toast({
        title: "Error",
        description: "Failed to generate breakdown. Please try again.",
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
              Beta
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

        <div className="space-y-8">
          {session && recentPrompts.length > 0 && (
            <Card className="p-6 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl">
              <h3 className="text-lg font-semibold mb-4 text-violet-600 dark:text-violet-400">Recent Prompts</h3>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {recentPrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => setProjectDescription(prompt.description)}
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
          )}

          <Card className="p-8 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-500">
            <div className="space-y-6">
              <Textarea 
                placeholder="Describe your project in detail... (e.g., I want to build a task management application with user authentication, real-time updates, and team collaboration features)" 
                value={projectDescription} 
                onChange={e => setProjectDescription(e.target.value)} 
                className="min-h-[200px] resize-none bg-white/50 dark:bg-black/50 backdrop-blur-md border-white/20 dark:border-white/10 rounded-xl placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:ring-violet-500/50 dark:focus-visible:ring-violet-400/50" 
              />
              <Button 
                onClick={generateBreakdown} 
                disabled={loading} 
                className="w-full group relative overflow-hidden bg-gradient-to-r from-rose-500 via-violet-500 to-teal-500 hover:from-rose-400 hover:via-violet-400 hover:to-teal-400 text-white rounded-xl py-6 transition-all duration-500 shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="animate-fade-in">{loadingMessages[loadingMessageIndex]}</span>
                  </div>
                ) : (
                  "Generate Work Breakdown & Estimation"
                )}
              </Button>
            </div>
          </Card>

          {breakdown && (
            <>
              <ProjectSummary features={breakdown.features} />

              <Card className="p-8 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom duration-700">
                <ScrollArea className="h-full w-full pr-4">
                  <div className="prose dark:prose-invert max-w-none">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-600 via-violet-600 to-teal-600 dark:from-rose-400 dark:via-violet-400 dark:to-teal-400 bg-clip-text text-transparent m-0">
                      Project Breakdown & Estimation
                    </h2>

                    <TechnicalConstraints
                      technicalComponents={breakdown.technicalComponents}
                      onSave={handleTechnicalComponentsSave}
                    />
                    
                    <div className="space-y-8 mt-6">
                      {breakdown.features.map((feature, index) => (
                        <div key={index} className="bg-black/5 dark:bg-white/5 rounded-xl p-6 space-y-4">
                          <Feature
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
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </Card>

              <Card className="p-8 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom duration-700">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-rose-600 via-violet-600 to-teal-600 dark:from-rose-400 dark:via-violet-400 dark:to-teal-400 bg-clip-text text-transparent mb-6">
                  Book a Consultation
                </h3>
                <div className="aspect-video w-full">
                  <iframe 
                    src="https://outlook.office.com/bookwithme/user/c9e0c61b439d439da88f930740cb677c@makonis.de/meetingtype/oMBQfrttp02v742OTM_65Q2?anonymous&ep=mLinkFromTile" 
                    className="w-full h-full rounded-lg border border-white/20" 
                    allow="camera; microphone; geolocation" 
                  />
                </div>
              </Card>
            </>
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
