
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input"; 
import { Loader2 } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { Breakdown, UserStory } from "@/types/project";

interface ProjectInputProps {
  projectDescription: string;
  setProjectDescription: Dispatch<SetStateAction<string>>;
  projectName: string;
  setProjectName: Dispatch<SetStateAction<string>>;
  setLoadingMessageIndex: Dispatch<SetStateAction<number>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setBreakdown: Dispatch<SetStateAction<Breakdown | null>>;
  setUserStories: Dispatch<SetStateAction<UserStory[] | null>>;
  setTechnicalConstraints: Dispatch<SetStateAction<string>>;
  setFeatures: Dispatch<SetStateAction<string>>;
  recentPrompts: string[];
  setRecentPrompts: Dispatch<SetStateAction<string[]>>;
}

export function ProjectInput({
  projectDescription,
  setProjectDescription,
  projectName,
  setProjectName,
  setLoadingMessageIndex,
  setIsLoading,
  setBreakdown,
  setUserStories,
  setTechnicalConstraints,
  setFeatures,
  recentPrompts,
  setRecentPrompts
}: ProjectInputProps) {
  
  const handleGenerate = () => {
    if (!projectDescription.trim()) return;
    
    setIsLoading(true);
    setLoadingMessageIndex(0);
    
    // Add to recent prompts if it's not already there
    if (!recentPrompts.includes(projectDescription)) {
      setRecentPrompts([projectDescription, ...recentPrompts.slice(0, 4)]);
    }
    
    // Simulate API call - replace with actual API call
    setTimeout(() => {
      // Mock data - replace with actual API response
      setBreakdown({
        features: [
          {
            name: "User Authentication",
            description: "Allow users to register, login, and manage their profiles",
            userStories: [
              "As a user, I can create an account",
              "As a user, I can log in to my account",
              "As a user, I can reset my password"
            ],
            estimation: {
              hours: 24,
              cost: 2400,
              details: "Includes OAuth integration and security implementation"
            }
          }
        ],
        technicalComponents: [
          "React frontend with TypeScript",
          "Node.js backend with Express",
          "MongoDB database",
          "JWT authentication"
        ]
      });
      
      setUserStories([
        {
          name: "User Authentication",
          description: "Allow users to register, login, and manage their profiles",
          userStories: [
            "As a user, I can create an account",
            "As a user, I can log in to my account",
            "As a user, I can reset my password"
          ],
          estimation: {
            hours: 24,
            cost: 2400,
            details: "Includes OAuth integration and security implementation"
          }
        }
      ]);
      
      setTechnicalConstraints("React frontend with TypeScript\nNode.js backend with Express\nMongoDB database\nJWT authentication");
      setFeatures("User Authentication: Allow users to register, login, and manage their profiles");
      
      setIsLoading(false);
    }, 3000);
  };
  
  return (
    <Card className="p-8 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-500 mb-8">
      <div className="space-y-6">
        <Input
          placeholder="Project Name"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          className="bg-white/50 dark:bg-black/50 backdrop-blur-md border-white/20 dark:border-white/10 rounded-xl"
        />
        <Textarea 
          placeholder="Describe your project in detail... (e.g., I want to build a task management application with user authentication, real-time updates, and team collaboration features)" 
          value={projectDescription} 
          onChange={e => setProjectDescription(e.target.value)} 
          className="min-h-[200px] resize-none bg-white/50 dark:bg-black/50 backdrop-blur-md border-white/20 dark:border-white/10 rounded-xl placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:ring-violet-500/50 dark:focus-visible:ring-violet-400/50" 
        />
        <Button 
          onClick={handleGenerate} 
          disabled={!projectDescription.trim()} 
          className="w-full group relative overflow-hidden bg-gradient-to-r from-rose-500 via-violet-500 to-teal-500 hover:from-rose-400 hover:via-violet-400 hover:to-teal-400 text-white rounded-xl py-6 transition-all duration-500 shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
        >
          Generate Work Breakdown & Estimation
        </Button>
      </div>
    </Card>
  );
}
