import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { LogOut, LogIn } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProjectSummary } from "@/components/ProjectSummary";
import { TechnicalConstraints } from "@/components/TechnicalConstraints";
import { Feature } from "@/components/Feature";
import { RecentPrompts } from "@/components/RecentPrompts";
import { ProjectInput } from "@/components/ProjectInput";
import { ConsultationSection } from "@/components/ConsultationSection";
import { ExportSection } from "@/components/ExportSection";
import { Breakdown, UserStory } from "@/types/project";
import { useNavigate } from "react-router-dom";

const loadingMessages = [
  "Refining the project scope...",
  "Identifying key features...",
  "Outlining technical constraints...",
  "Estimating development time...",
  "Preparing the final breakdown...",
];

const Index = () => {
  const [session, setSession] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projectDescription, setProjectDescription] = useState("");
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [userStories, setUserStories] = useState<UserStory[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [technicalConstraints, setTechnicalConstraints] = useState("");
  const [features, setFeatures] = useState("");
  const [projectName, setProjectName] = useState("");
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out successfully",
      description: "You have been signed out of your account.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-rose-100 via-violet-100 to-teal-100 dark:from-rose-950 dark:via-violet-950 dark:to-teal-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 via-violet-600 to-teal-600 dark:from-rose-400 dark:via-violet-400 dark:to-teal-400 bg-clip-text text-transparent">
            Project Sage
          </h1>
          {session ? (
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>

        <ProjectInput
          projectDescription={projectDescription}
          setProjectDescription={setProjectDescription}
          projectName={projectName}
          setProjectName={setProjectName}
          setLoadingMessageIndex={setLoadingMessageIndex}
          setIsLoading={setIsLoading}
          setBreakdown={setBreakdown}
          setUserStories={setUserStories}
          setTechnicalConstraints={setTechnicalConstraints}
          setFeatures={setFeatures}
          recentPrompts={recentPrompts}
          setRecentPrompts={setRecentPrompts}
        />

        {breakdown && userStories ? (
          <>
            <ProjectSummary
              projectName={projectName}
              projectDescription={projectDescription}
            />
            <TechnicalConstraints technicalConstraints={technicalConstraints} />
            <Feature features={features} />
            <ConsultationSection />
            <ExportSection
              breakdown={breakdown}
              userStories={userStories}
              projectName={projectName}
              isExporting={isExporting}
              setIsExporting={setIsExporting}
            />
          </>
        ) : (
          <RecentPrompts
            recentPrompts={recentPrompts}
            setProjectDescription={setProjectDescription}
            setLoadingMessageIndex={setLoadingMessageIndex}
            setIsLoading={setIsLoading}
            setBreakdown={setBreakdown}
            setUserStories={setUserStories}
            setTechnicalConstraints={setTechnicalConstraints}
            setFeatures={setFeatures}
            setProjectName={setProjectName}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
