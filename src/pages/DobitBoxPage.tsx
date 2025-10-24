"use client";

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";

const DobitBoxPage = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();

  useEffect(() => {
    const checkUserRoleAndRedirect = async () => {
      if (!sessionLoading && user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          showError("Failed to fetch user role. Redirecting to dashboard.");
          navigate("/student-dashboard"); // Fallback to student dashboard
          return;
        }

        if (profile?.role === 'admin') {
          navigate("/admin/resolve-dobits"); // Admins go to resolve page
        } else {
          navigate("/dobit-box/my-doubts"); // Students go to their doubts page
        }
      } else if (!sessionLoading && !user) {
        navigate("/"); // Redirect to login if not authenticated
      }
    };

    checkUserRoleAndRedirect();
  }, [sessionLoading, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <span className="ml-3 text-lg text-muted-foreground">Loading Dobit Box...</span>
    </div>
  );
};

export default DobitBoxPage;