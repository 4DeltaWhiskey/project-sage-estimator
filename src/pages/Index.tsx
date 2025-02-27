import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, Euro, Clock, Info, LogOut, LogIn, Pencil, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface UserStory {
  name: string;
  description: string;
  userStories: string[];
  technicalComponents: string[];
  estimation?: {
    hours: number;
    cost: number;
    details: string;
  };
}

interface Breakdown {
  features: UserStory[];
}

const Index = () => {
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
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
    technicalComponents: string;
  } | null>(null);
  const { toast } = useToast();

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

      const enhancedBreakdown = {
        features: data.features.map((feature: UserStory, index: number) => ({
          ...feature,
          estimation: estimationData.estimations[index]
        }))
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

  const startEditing = (index: number, feature: UserStory) => {
    setEditingFeature(index);
    setEditedContent({
      name: feature.name,
      description: feature.description,
      userStories: feature.userStories.join('\n'),
      technicalComponents: feature.technicalComponents.join('\n'),
    });
  };

  const saveEdits = async (index: number) => {
    if (!editedContent) return;

    const updatedFeatures = [...(breakdown?.features || [])];
    updatedFeatures[index] = {
      ...updatedFeatures[index],
      name: editedContent.name,
      description: editedContent.description,
      userStories: editedContent.userStories.split('\n').filter(story => story.trim()),
      technicalComponents: editedContent.technicalComponents.split('\n').filter(tech => tech.trim()),
    };

    try {
      toast({
        title: "Updating Feature",
        description: "Recalculating time and budget estimation...",
      });

      const { data: estimationData, error: estimationError } = await supabase.functions.invoke('generate-estimate', {
        body: {
          description: projectDescription,
          breakdown: { features: [updatedFeatures[index]] },
          hourlyRate: 50
        }
      });

      if (estimationError) throw estimationError;

      updatedFeatures[index].estimation = estimationData.estimations[0];

      setBreakdown({
        features: updatedFeatures
      });

      setEditingFeature(null);
      setEditedContent(null);

      toast({
        title: "Feature Updated",
        description: "The feature has been updated with new time and budget estimates.",
      });
    } catch (error) {
      console.error('Error updating feature:', error);
      toast({
        title: "Error",
        description: "Failed to update feature and recalculate estimation. Please try again.",
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
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Generate Work Breakdown & Estimation"}
              </Button>
            </div>
          </Card>

          {breakdown && (
            <>
              <Card className="p-8 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom duration-700">
                <ScrollArea className="h-full w-full pr-4">
                  <div className="prose dark:prose-invert max-w-none">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-600 via-violet-600 to-teal-600 dark:from-rose-400 dark:via-violet-400 dark:to-teal-400 bg-clip-text text-transparent m-0">
                      Project Breakdown & Estimation
                    </h2>
                    
                    <div className="space-y-8 mt-6">
                      {breakdown.features.map((feature, index) => (
                        <div key={index} className="bg-black/5 dark:bg-white/5 rounded-xl p-6 space-y-4">
                          {editingFeature === index ? (
                            <div className="space-y-4">
                              <Input
                                value={editedContent?.name}
                                onChange={(e) => setEditedContent(prev => ({ ...prev!, name: e.target.value }))}
                                className="font-semibold text-xl w-full"
                                placeholder="Feature name"
                              />
                              <Textarea
                                value={editedContent?.description}
                                onChange={(e) => setEditedContent(prev => ({ ...prev!, description: e.target.value }))}
                                className="w-full"
                                placeholder="Feature description"
                              />
                              <div>
                                <label className="text-sm font-medium text-violet-600 dark:text-violet-400 block mb-2">
                                  User Stories (one per line)
                                </label>
                                <Textarea
                                  value={editedContent?.userStories}
                                  onChange={(e) => setEditedContent(prev => ({ ...prev!, userStories: e.target.value }))}
                                  className="w-full"
                                  placeholder="Enter user stories, one per line"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-teal-600 dark:text-teal-400 block mb-2">
                                  Technical Components (one per line)
                                </label>
                                <Textarea
                                  value={editedContent?.technicalComponents}
                                  onChange={(e) => setEditedContent(prev => ({ ...prev!, technicalComponents: e.target.value }))}
                                  className="w-full"
                                  placeholder="Enter technical components, one per line"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setEditingFeature(null);
                                    setEditedContent(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={() => saveEdits(index)}>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-4">
                                <h3 className="text-xl font-semibold text-rose-600 dark:text-rose-400 m-0">
                                  {feature.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditing(index, feature)}
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

                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-teal-600 dark:text-teal-400 m-0">
                                  Technical Components
                                </h4>
                                <ul className="list-none p-0 m-0 space-y-2">
                                  {feature.technicalComponents.map((tech, techIndex) => (
                                    <li key={techIndex} className="flex items-start gap-2 text-sm">
                                      <CheckCircle2 className="h-4 w-4 mt-1 text-violet-500" />
                                      {tech}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </>
                          )}
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

        <Dialog open={authDialog} onOpenChange={setAuthDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isSignUp ? 'Create an account' : 'Welcome back'}</DialogTitle>
              <DialogDescription>
                {isSignUp 
                  ? 'Sign up to save your prompts and access them anytime' 
                  : 'Sign in to your account to access your saved prompts'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={authLoading}>
                  {authLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isSignUp ? (
                    'Sign Up'
                  ) : (
                    'Sign In'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Sign Up"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
