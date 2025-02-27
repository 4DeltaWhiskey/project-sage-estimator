
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dispatch, SetStateAction } from "react";
import { Breakdown, UserStory } from "@/types/project";

interface RecentPromptsProps {
  recentPrompts: string[];
  setProjectDescription: Dispatch<SetStateAction<string>>;
  setLoadingMessageIndex: Dispatch<SetStateAction<number>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setBreakdown: Dispatch<SetStateAction<Breakdown | null>>;
  setUserStories: Dispatch<SetStateAction<UserStory[] | null>>;
  setTechnicalConstraints: Dispatch<SetStateAction<string>>;
  setFeatures: Dispatch<SetStateAction<string>>;
  setProjectName: Dispatch<SetStateAction<string>>;
}

export function RecentPrompts({ 
  recentPrompts, 
  setProjectDescription,
  setLoadingMessageIndex,
  setIsLoading,
  setBreakdown,
  setUserStories,
  setTechnicalConstraints,
  setFeatures,
  setProjectName
}: RecentPromptsProps) {
  if (recentPrompts.length === 0) return null;

  const handleSelectPrompt = (prompt: string) => {
    setProjectDescription(prompt);
    
    // Automatically generate for selected prompt
    setIsLoading(true);
    setLoadingMessageIndex(0);
    
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
      
      // Extract project name from prompt - simple example
      const projectName = prompt.split(" ").slice(0, 3).join(" ") + "...";
      setProjectName(projectName);
      
      setIsLoading(false);
    }, 3000);
  };

  return (
    <Card className="p-6 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl">
      <h3 className="text-lg font-semibold mb-4 text-violet-600 dark:text-violet-400">Recent Prompts</h3>
      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {recentPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleSelectPrompt(prompt)}
              className="w-full text-left p-3 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-sm"
            >
              {prompt.length > 100
                ? `${prompt.slice(0, 100)}...`
                : prompt}
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
