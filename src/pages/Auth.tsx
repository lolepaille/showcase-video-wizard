
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  // If already signed in, redirect to /
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate("/");
    });
  }, [navigate]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    setSending(false);
    if (!error) setSent(true);
    // Optionally display error if error exists
    // You could use a toast for nicer UX
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white shadow-lg p-8 rounded-xl">
      <h1 className="text-2xl font-bold mb-4">Sign up or Log in</h1>
      {sent ? (
        <p className="text-green-700">
          Check your inbox for a magic link to continue!
        </p>
      ) : (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <Input
            type="email"
            placeholder="your.email@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Button type="submit" disabled={sending || !email}>
            {sending ? "Sending..." : "Send Magic Link"}
          </Button>
        </form>
      )}
    </div>
  );
};

export default AuthPage;
