"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
// useSession को अब सीधे signOut लॉजिक में उपयोग नहीं किया जाएगा,
// बल्कि supabase.auth.getSession() का उपयोग किया जाएगा।
// import { useSession } from '@/components/SessionContextProvider'; 

const SignOutButton = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // const { session } = useSession(); // अब सीधे supabase.auth.getSession() का उपयोग करेंगे

  const handleSignOut = async () => {
    setLoading(true);
    try {
      // Supabase क्लाइंट से सीधे वर्तमान सत्र प्राप्त करें
      const { data: { session: currentSupabaseSession }, error: getSessionError } = await supabase.auth.getSession();

      if (getSessionError || !currentSupabaseSession) {
        console.warn("No active Supabase session found. Redirecting directly.");
        showSuccess("No active session found. Redirecting to login.");
        navigate("/");
        return; // यदि कोई सत्र नहीं है तो जल्दी बाहर निकलें
      }

      // यदि एक सत्र पाया जाता है, तो signOut के साथ आगे बढ़ें
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error("Error during sign out:", signOutError.message);
        showError(`Sign out failed: ${signOutError.message}. Attempting to clear local session.`);
      } else {
        showSuccess("Successfully signed out!");
      }
      // signOut के प्रयास के बाद हमेशा लॉगिन पेज पर रीडायरेक्ट करें
      navigate("/");
    } catch (error: any) {
      console.error("Unexpected error during sign out:", error.message);
      showError(`An unexpected error occurred during sign out: ${error.message}`);
      navigate("/"); // अप्रत्याशित त्रुटियों पर भी रीडायरेक्शन सुनिश्चित करें
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