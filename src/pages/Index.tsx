
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<string | null>(null);
  const { toast } = useToast();

  const generateEstimate = async () => {
    if (!projectDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please provide a project description to generate an estimate.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/functions/generate-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: projectDescription }),
      });

      if (!response.ok) throw new Error('Failed to generate estimate');

      const data = await response.json();
      setEstimate(data.generatedText);
      toast({
        title: "Estimate Generated",
        description: "Your project estimate has been created successfully.",
      });
    } catch (error) {
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-6 text-center mb-12">
          <span className="px-3 py-1 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 rounded-full inline-block">
            Project Sage
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Software Development Estimator
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">
            Describe your software project, and let our AI generate a detailed work breakdown structure and estimation.
          </p>
        </div>

        <Card className="p-6 backdrop-blur-lg bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
          <div className="space-y-4">
            <Textarea
              placeholder="Describe your project in detail... (e.g., I want to build a task management application with user authentication, real-time updates, and team collaboration features)"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="min-h-[200px] resize-none bg-transparent"
            />
            <Button 
              onClick={generateEstimate} 
              disabled={loading} 
              className="w-full group relative overflow-hidden"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Generate Estimate"
              )}
            </Button>
          </div>
        </Card>

        {estimate && (
          <Card className="mt-8 p-6 backdrop-blur-lg bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
            <ScrollArea className="h-[400px] pr-4">
              <div className="prose dark:prose-invert max-w-none">
                <h2 className="text-xl font-semibold mb-4">Project Breakdown</h2>
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {estimate}
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
