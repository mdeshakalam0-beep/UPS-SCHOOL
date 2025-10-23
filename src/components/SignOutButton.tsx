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
      const { error } = await supabase.auth.signOut();
      if (error) {
        showError(error.message);
      } else {
        showSuccess("Successfully signed out!");
        navigate("/"); // Redirect to login page after sign out
      }
    } catch (error: any) {
      showError(error.message);
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