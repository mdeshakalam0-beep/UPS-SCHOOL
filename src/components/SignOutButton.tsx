"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';

const SignOutButton = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setLoading(true);
    try {
      // supabase.auth.signOut() will attempt to invalidate the session on the server
      // and clear the local session storage.
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error during sign out:", error.message);
        showError(`Sign out failed: ${error.message}. Attempting to clear local session.`);
      } else {
        showSuccess("Successfully signed out!");
      }
      
      // Always redirect to the login page and then force a full page reload.
      // This ensures that the entire application state and Supabase client
      // are completely reset, clearing any lingering session data.
      navigate("/");
      window.location.reload(); // Force a full page reload
    } catch (error: any) {
      console.error("Unexpected error during sign out:", error.message);
      showError(`An unexpected error occurred during sign out: ${error.message}`);
      navigate("/"); // Ensure redirection even on unexpected errors
      window.location.reload(); // Force a full page reload
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