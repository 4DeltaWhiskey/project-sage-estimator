
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy, Loader2 } from "lucide-react";
import { Breakdown } from "@/types/project";
import { useToast } from "@/components/ui/use-toast";

interface BuildWithLovableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  breakdown: Breakdown | null;
  projectDescription: string;
}

export function BuildWithLovableModal({
  open,
  onOpenChange,
  breakdown,
  projectDescription,
}: BuildWithLovableModalProps) {
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  // Generate a prompt when the modal opens
  useEffect(() => {
    if (open) {
      generatePrompt();
    }
  }, [open, breakdown, projectDescription]);

  const generatePrompt = () => {
    setIsGenerating(true);
    
    // Create a delay to simulate processing
    setTimeout(() => {
      let prompt = "";
      
      // Add project description
      prompt += `I want to build a web application with the following description:\n\n${projectDescription}\n\n`;
      
      // Add features and user stories
      if (breakdown && breakdown.features.length > 0) {
        prompt += "The application should include the following features:\n\n";
        
        breakdown.features.forEach((feature, index) => {
          prompt += `${index + 1}. ${feature.name}: ${feature.description}\n`;
          
          // Add user stories for each feature
          if (feature.userStories.length > 0) {
            prompt += "   User Stories:\n";
            feature.userStories.forEach((story, storyIdx) => {
              prompt += `   - ${story}\n`;
            });
          }
          
          prompt += "\n";
        });
      }
      
      // Add technical constraints
      if (breakdown && breakdown.technicalComponents.length > 0) {
        prompt += "Technical constraints and components to use:\n";
        breakdown.technicalComponents.forEach((tech) => {
          prompt += `- ${tech}\n`;
        });
        prompt += "\n";
      }
      
      // Add final instructions for Lovable
      prompt += `Please create a responsive, modern web application based on these requirements using React, Typescript, and Tailwind CSS. Start by showing me a basic structure of the main page with navigation and key components.`;
      
      setGeneratedPrompt(prompt);
      setIsGenerating(false);
    }, 1000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setIsCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "The prompt has been copied to your clipboard.",
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Copy failed",
        description: "Could not copy the prompt to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-violet-600 dark:text-violet-400">
            Build with Lovable
          </DialogTitle>
          <DialogDescription>
            Use this prompt in Lovable to build your application based on your project requirements.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col mt-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Generated Prompt
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy}
              disabled={isGenerating}
              className="flex items-center gap-1"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          
          <div className="relative flex-1 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            {isGenerating ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Generating prompt...
                  </span>
                </div>
              </div>
            ) : null}
            
            <pre className="h-full overflow-auto bg-white dark:bg-[#1A1F2C] text-black dark:text-white p-4 text-sm font-mono">
              {generatedPrompt}
            </pre>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button
            variant="default" 
            onClick={() => window.open("https://lovable.dev", "_blank")}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            Open Lovable
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
