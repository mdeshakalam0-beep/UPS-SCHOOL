"use client";

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";
import { Loader2, MessageSquare, BookOpen, Users } from "lucide-react";
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <MessageSquare className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Dobit Box</h1>
          <p className="text-slate-600 mb-8">Your gateway to clearing doubts and learning better</p>
          
          <div className="flex justify-center mb-8">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
          
          <p className="text-lg text-slate-700 mb-6">Loading Dobit Box...</p>
          
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 text-center shadow-md">
            <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Ask Questions</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-md">
            <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Get Answers</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-md">
            <BookOpen className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Learn Better</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DobitBoxPage;