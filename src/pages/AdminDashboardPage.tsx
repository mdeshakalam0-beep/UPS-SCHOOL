"use client";

import React, { useState, useEffect } from "react"; // Added useEffect
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import ManageStudentsPage from "./admin/ManageStudentsPage";
import ManageNotesPage from "././admin/ManageNotesPage";
import ManageObjectiveTestsPage from "./admin/ManageObjectiveTestsPage";
import ManageSubjectiveTestsPage from "./admin/ManageSubjectiveTestsPage";
import ResolveDobitsPage from "./admin/ResolveDobitsPage";
import ViewResultsPage from "./admin/ViewResultsPage";
import ManageBannersNotificationsPage from "./admin/ManageBannersNotificationsPage";
import SignOutButton from "@/components/SignOutButton";
import { Users, Book, ClipboardCheck, FileText, MessageSquare, Award, Image, Loader2 } from "lucide-react"; // Added Loader2
import { useSession } from "@/components/SessionContextProvider"; // Import useSession
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient"; // Import supabase

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const [activeTab, setActiveTab] = useState("students");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!sessionLoading && session) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("Error fetching admin profile:", error);
          // If profile not found or error, assume not admin
          setUserRole(null);
          navigate("/student-dashboard"); // Redirect to student dashboard or login
        } else if (profile?.role === 'admin') {
          setUserRole('admin');
        } else {
          setUserRole('student');
          navigate("/student-dashboard"); // Redirect if not admin
        }
      } else if (!sessionLoading && !session) {
        // If no session, redirect to login
        navigate("/");
      }
      setRoleLoading(false);
    };

    fetchUserRole();
  }, [session, sessionLoading, navigate]);

  if (sessionLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading admin dashboard...</span>
      </div>
    );
  }

  if (userRole !== 'admin') {
    // This case should ideally be caught by the useEffect redirect,
    // but as a fallback, we can render nothing or a message.
    return null; 
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-6xl shadow-lg rounded-lg mb-6">
        <CardHeader className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-primary">Admin Dashboard</h1>
          <p className="text-xl text-muted-foreground">UPS PUBLISH SCHOOL Control Panel</p>
          <div className="mt-4">
            <SignOutButton />
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1 h-auto p-1 mb-4">
          <TabsTrigger value="students" className="flex flex-col items-center justify-center p-2 h-auto">
            <Users className="h-5 w-5 mb-1" />
            <span className="text-xs sm:text-sm text-center">Students</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex flex-col items-center justify-center p-2 h-auto">
            <Book className="h-5 w-5 mb-1" />
            <span className="text-xs sm:text-sm text-center">Notes/PDFs</span>
          </TabsTrigger>
          <TabsTrigger value="objective-tests" className="flex flex-col items-center justify-center p-2 h-auto">
            <ClipboardCheck className="h-5 w-5 mb-1" />
            <span className="text-xs sm:text-sm text-center">Objective Tests</span>
          </TabsTrigger>
          <TabsTrigger value="subjective-tests" className="flex flex-col items-center justify-center p-2 h-auto">
            <FileText className="h-5 w-5 mb-1" />
            <span className="text-xs sm:text-sm text-center">Subjective Tests</span>
          </TabsTrigger>
          <TabsTrigger value="dobits" className="flex flex-col items-center justify-center p-2 h-auto">
            <MessageSquare className="h-5 w-5 mb-1" />
            <span className="text-xs sm:text-sm text-center">Dobits</span>
          </TabsTrigger>
          <TabsTrigger value="results" className="flex flex-col items-center justify-center p-2 h-auto">
            <Award className="h-5 w-5 mb-1" />
            <span className="text-xs sm:text-sm text-center">Results</span>
          </TabsTrigger>
          <TabsTrigger value="banners-notifications" className="flex flex-col items-center justify-center p-2 h-auto">
            <Image className="h-5 w-5 mb-1" />
            <span className="text-xs sm:text-sm text-center">Banners & Notifs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <ManageStudentsPage />
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
          <ManageNotesPage />
        </TabsContent>
        <TabsContent value="objective-tests" className="mt-4">
          <ManageObjectiveTestsPage />
        </TabsContent>
        <TabsContent value="subjective-tests" className="mt-4">
          <ManageSubjectiveTestsPage />
        </TabsContent>
        <TabsContent value="dobits" className="mt-4">
          <ResolveDobitsPage />
        </TabsContent>
        <TabsContent value="results" className="mt-4">
          <ViewResultsPage />
        </TabsContent>
        <TabsContent value="banners-notifications" className="mt-4">
          <ManageBannersNotificationsPage />
        </TabsContent>
      </Tabs>

      <MadeWithDyad />
    </div>
  );
};

export default AdminDashboardPage;