"use client";

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";
import { Loader2, MessageSquare, BookOpen, Users, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import BottomNavigationBar from "@/components/BottomNavigationBar";

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
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-5xl mb-6">
        <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2 bg-white shadow-md hover:shadow-lg transition-shadow">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>
      
      <Card className="w-full max-w-5xl shadow-xl rounded-2xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-24 h-24 bg-white/20 p-4 rounded-full">
                <MessageSquare className="h-16 w-16 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center">Dobit Box</CardTitle>
          <CardDescription className="text-blue-100 text-center mt-2">
            Your gateway to clearing doubts and learning better
          </CardDescription>
        </div>
        
        <CardContent className="p-8">
          <div className="text-center py-8">
            <div className="flex justify-center mb-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
            
            <p className="text-xl text-slate-700 mb-8">Loading Dobit Box...</p>
            
            <div className="flex justify-center space-x-2 mb-12">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 p-3 rounded-full mx-auto mb-4">
                  <MessageSquare className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Ask Questions</h3>
                <p className="text-slate-600">Post your doubts and questions</p>
              </div>
            </Card>
            
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 text-center">
                <div className="w-16 h-16 bg-green-100 p-3 rounded-full mx-auto mb-4">
                  <Users className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Get Answers</h3>
                <p className="text-slate-600">Receive responses from teachers</p>
              </div>
            </Card>
            
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 p-3 rounded-full mx-auto mb-4">
                  <BookOpen className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Learn Better</h3>
                <p className="text-slate-600">Improve your understanding</p>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default DobitBoxPage;