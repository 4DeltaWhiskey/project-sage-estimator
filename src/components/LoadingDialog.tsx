
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Ghost, Bot, Brain, Laugh } from "lucide-react";
import { useState, useEffect } from "react";

const funnyMessages = [
  { text: "Teaching AI to count on its digital fingers...", Icon: Bot },
  { text: "Consulting with our ghost developers...", Icon: Ghost },
  { text: "Processing with our quantum abacus...", Icon: Brain },
  { text: "Negotiating hours with our AI team...", Icon: Laugh },
];

export function LoadingDialog({ open }: { open: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (open) {
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % funnyMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [open]);

  const CurrentIcon = funnyMessages[messageIndex].Icon;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          <div className="animate-bounce">
            <CurrentIcon className="w-12 h-12 text-violet-500" />
          </div>
          <p className="text-lg font-medium text-center">
            {funnyMessages[messageIndex].text}
          </p>
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
