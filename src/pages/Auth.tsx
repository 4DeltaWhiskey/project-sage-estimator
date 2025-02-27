
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthDialog } from "@/components/AuthDialog";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [isOpen, setIsOpen] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = isSignUp
        ? await supabase.auth.signUp({
            email,
            password,
          })
        : await supabase.auth.signInWithPassword({
            email,
            password,
          });

      if (error) throw error;

      // On successful auth, navigate to home
      navigate("/");
    } catch (error: any) {
      console.error("Authentication error:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to home if dialog is closed
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-rose-100 via-violet-100 to-teal-100 dark:from-rose-950 dark:via-violet-950 dark:to-teal-950">
      <AuthDialog
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        isSignUp={isSignUp}
        onSignUpToggle={() => setIsSignUp(!isSignUp)}
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
