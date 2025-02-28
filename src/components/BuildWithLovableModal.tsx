
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
import { supabase } from "@/integrations/supabase/client";

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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate a prompt when the modal opens
  useEffect(() => {
    if (open && breakdown) {
      generatePromptWithAI();
    }
  }, [open, breakdown, projectDescription]);

  const generatePromptWithAI = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Call the Supabase edge function to generate the prompt
      const { data, error } = await supabase.functions.invoke('generate-lovable-prompt', {
        body: { 
          projectDescription, 
          breakdown 
        }
      });

      if (error) {
        console.error('Error generating prompt:', error);
        
        // Use fallback if edge function fails
        const fallbackPrompt = generateFallbackPrompt();
        setGeneratedPrompt(fallbackPrompt);
        
        // Notify user about fallback
        toast({
          title: "Using local prompt generation",
          description: "We're using locally generated prompt due to connection issues.",
          variant: "default",
        });
        
        return;
      }

      if (data?.error) {
        console.error('AI service error:', data.error);
        
        // Use fallback if there's a data error
        const fallbackPrompt = generateFallbackPrompt();
        setGeneratedPrompt(fallbackPrompt);
        
        toast({
          title: "Using local prompt generation",
          description: "We're using locally generated prompt due to AI service issues.",
          variant: "default",
        });
        
        return;
      }

      setGeneratedPrompt(data.prompt);
    } catch (error) {
      console.error('Unexpected error:', error);
      
      // Use fallback for unexpected errors
      const fallbackPrompt = generateFallbackPrompt();
      setGeneratedPrompt(fallbackPrompt);
      
      toast({
        title: "Using local prompt generation",
        description: "We're using locally generated prompt due to an unexpected error.",
        variant: "default",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Fallback prompt generation in case the AI service is unavailable
  const generateFallbackPrompt = () => {
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
    
    return prompt;
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

  const handleRetry = () => {
    generatePromptWithAI();
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
            <div className="flex gap-2">
              {error && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  className="flex items-center gap-1"
                >
                  Retry
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopy}
                disabled={isGenerating || !!error}
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
          </div>
          
          <div className="relative flex-1 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            {isGenerating ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Generating prompt with AI...
                  </span>
                </div>
              </div>
            ) : null}
            
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4 max-w-md text-center">
                  <span className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </span>
                  <Button 
                    variant="default" 
                    onClick={handleRetry}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    Try Again
                  </Button>
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
