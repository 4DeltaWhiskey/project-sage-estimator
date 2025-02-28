
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
      console.log("Modal opened with breakdown, generating prompt...");
      setIsGenerating(true);
      setError(null);
      generatePromptWithAI();
    }
  }, [open, breakdown, projectDescription]);

  const generatePromptWithAI = async () => {
    console.log("Calling Supabase edge function...");
    try {
      // Call the Supabase edge function to generate the prompt
      const { data, error: functionError } = await supabase.functions.invoke('generate-lovable-prompt', {
        body: { 
          projectDescription, 
          breakdown 
        }
      });

      console.log("Edge function response:", { data, error: functionError });

      if (functionError) {
        console.error('Error from edge function:', functionError);
        setError(`Failed to generate prompt: ${functionError.message}`);
        toast({
          title: "Error",
          description: "Failed to generate prompt with AI. Please try again.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      if (data?.error) {
        console.error('AI service error:', data.error);
        setError(`AI service error: ${data.error}`);
        toast({
          title: "AI Service Error",
          description: data.error,
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      if (!data || !data.prompt) {
        console.error('Invalid response from edge function:', data);
        setError("Received invalid response from AI service");
        toast({
          title: "Error",
          description: "Received invalid response from AI service.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      console.log("Prompt generated successfully");
      setGeneratedPrompt(data.prompt);
      setIsGenerating(false);
    } catch (error: any) {
      console.error('Unexpected error during prompt generation:', error);
      setError(`Unexpected error: ${error.message}`);
      setIsGenerating(false);
      toast({
        title: "Error",
        description: "An unexpected error occurred while generating the prompt.",
        variant: "destructive",
      });
    }
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
    setIsGenerating(true);
    setError(null);
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
