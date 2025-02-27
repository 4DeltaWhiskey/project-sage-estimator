
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isSignUp: boolean;
  onSignUpToggle: () => void;
  email: string;
  onEmailChange: (email: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export function AuthDialog({
  isOpen,
  onOpenChange,
  isSignUp,
  onSignUpToggle,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  onSubmit,
  isLoading,
}: AuthDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isSignUp ? 'Create an account' : 'Welcome back'}</DialogTitle>
          <DialogDescription>
            {isSignUp 
              ? 'Sign up to save your prompts and access them anytime' 
              : 'Sign in to your account to access your saved prompts'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
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
              onClick={onSignUpToggle}
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
