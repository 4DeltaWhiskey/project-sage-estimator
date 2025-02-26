import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, Euro } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserStory {
  name: string;
  description: string;
  userStories: string[];
  technicalComponents: string[];
}

interface Breakdown {
  features: UserStory[];
}

const Index = () => {
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [estimate, setEstimate] = useState<string | null>(null);
  const { toast } = useToast();

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
      const { data, error } = await supabase.functions.invoke('generate-breakdown', {
        body: { description: projectDescription }
      });

      if (error) throw error;

      setBreakdown(data);
      setEstimate(null);
      toast({
        title: "Breakdown Generated",
        description: "Please review the breakdown and confirm to get an estimation.",
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

  const generateEstimate = async () => {
    if (!breakdown) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-estimate', {
        body: { 
          description: projectDescription, 
          breakdown,
          hourlyRate: 50
        }
      });

      if (error) throw error;

      setEstimate(data.generatedText);
      toast({
        title: "Estimate Generated",
        description: "Your project estimate has been created successfully.",
      });
    } catch (error) {
      console.error('Error generating estimate:', error);
      toast({
        title: "Error",
        description: "Failed to generate estimate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-violet-100 to-teal-100 dark:from-rose-950/30 dark:via-violet-950/30 dark:to-teal-950/30">
      <div className="container mx-auto px-4 py-12 max-w-4xl relative">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl rounded-3xl" />
        
        <div className="relative space-y-6 text-center mb-12">
          <span className="px-4 py-1.5 text-sm font-medium bg-white/10 backdrop-blur-md rounded-full inline-block shadow-xl border border-white/20 hover:border-white/40 transition-colors">
            Project Sage
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-rose-600 via-violet-600 to-teal-600 dark:from-rose-400 dark:via-violet-400 dark:to-teal-400 bg-clip-text text-transparent">
            Software Development Estimator
          </h1>
          <p className="text-zinc-600 dark:text-zinc-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Describe your software project, and let our AI generate a detailed work breakdown structure and estimation.
          </p>
        </div>

        <Card className="p-8 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-500">
          <div className="space-y-6">
            <Textarea
              placeholder="Describe your project in detail... (e.g., I want to build a task management application with user authentication, real-time updates, and team collaboration features)"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="min-h-[200px] resize-none bg-white/50 dark:bg-black/50 backdrop-blur-md border-white/20 dark:border-white/10 rounded-xl placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:ring-violet-500/50 dark:focus-visible:ring-violet-400/50"
            />
            <Button 
              onClick={generateBreakdown} 
              disabled={loading} 
              className="w-full group relative overflow-hidden bg-gradient-to-r from-rose-500 via-violet-500 to-teal-500 hover:from-rose-400 hover:via-violet-400 hover:to-teal-400 text-white rounded-xl py-6 transition-all duration-500 shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Generate Work Breakdown"
              )}
            </Button>
          </div>
        </Card>

        {breakdown && (
          <Card className="mt-8 p-8 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom duration-700">
            <ScrollArea className="h-[600px] pr-4">
              <div className="prose dark:prose-invert max-w-none">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-600 via-violet-600 to-teal-600 dark:from-rose-400 dark:via-violet-400 dark:to-teal-400 bg-clip-text text-transparent m-0">
                    Project Breakdown
                  </h2>
                  {!estimate && (
                    <Button
                      onClick={generateEstimate}
                      disabled={loading}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Generate Estimate"
                      )}
                    </Button>
                  )}
                </div>
                
                <div className="space-y-8">
                  {breakdown.features.map((feature, index) => (
                    <div key={index} className="bg-black/5 dark:bg-white/5 rounded-xl p-6 space-y-4">
                      <h3 className="text-xl font-semibold text-rose-600 dark:text-rose-400 m-0">
                        {feature.name}
                      </h3>
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
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </Card>
        )}

        {estimate && (
          <Card className="mt-8 p-8 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom duration-700">
            <ScrollArea className="h-[400px] pr-4">
              <div className="prose dark:prose-invert max-w-none">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-600 via-violet-600 to-teal-600 dark:from-rose-400 dark:via-violet-400 dark:to-teal-400 bg-clip-text text-transparent mb-6">
                  Project Estimate
                </h2>
                <div className="space-y-6">
                  <div className="bg-black/5 dark:bg-white/5 rounded-xl p-6">
                    <div className="whitespace-pre-wrap font-mono text-sm">
                      {estimate}
                    </div>
                  </div>
                  
                  <div className="bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                      <Euro className="h-5 w-5" />
                      Hourly Rate: 50€
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      Final costs will be calculated based on the actual time spent on development.
                    </p>
                  </div>

                  <div className="bg-violet-500/10 dark:bg-violet-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-violet-600 dark:text-violet-400 mb-4">
                      Book a Consultation
                    </h3>
                    <div className="aspect-video w-full">
                      <iframe 
                        src="https://outlook.office.com/bookwithme/user/c9e0c61b439d439da88f930740cb677c@makonis.de/meetingtype/oMBQfrttp02v742OTM_65Q2?anonymous&ep=mLinkFromTile"
                        className="w-full h-full rounded-lg border border-white/20"
                        allow="camera; microphone; geolocation"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
