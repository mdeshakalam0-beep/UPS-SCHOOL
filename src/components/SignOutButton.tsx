"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/components/SessionContextProvider'; // Import useSession

const SignOutButton = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useSession(); // Get session from context

  const handleSignOut = async () => {
    setLoading(true);
    
    if (!session) {
      // If no session is found, just redirect to login.
      // This prevents calling signOut on an already missing session.
      showSuccess("No active session found. Redirecting to login.");
      navigate("/");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during sign out:", error.message);
        showError(`Sign out failed: ${error.message}. Attempting to clear local session.`);
      } else {
        showSuccess("Successfully signed out!");
      }
      // Always redirect to the login page after attempting to sign out,
      // as the local session should be cleared by supabase.auth.signOut()
      // regardless of server response for the token.
      navigate("/");
    } catch (error: any) {
      console.error("Unexpected error during sign out:", error.message);
      showError(`An unexpected error occurred during sign out: ${error.message}`);
      navigate("/"); // Ensure redirection even on unexpected errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleSignOut} disabled={loading} className="flex items-center space-x-2">
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      <span>Sign Out</span>
    </Button>
  );
};

export default SignOutButton;