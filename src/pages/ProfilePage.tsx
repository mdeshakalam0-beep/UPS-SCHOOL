"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, User, Mail, Phone, CalendarDays, GraduationCap, Loader2 } from "lucide-react"; // Removed Gender, kept User
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import SignOutButton from "@/components/SignOutButton";
import BottomNavigationBar from "@/components/BottomNavigationBar";

interface UserProfile {
  first_name: string;
  last_name: string | null;
  email: string;
  class: string | null;
  date_of_birth: string | null;
  gender: string | null;
  mobile_number: string | null;
  role: string;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, class, date_of_birth, gender, mobile_number, role, auth_users:id(email)')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          showError("Failed to load profile details.");
          setProfile(null);
        } else if (data) {
          setProfile({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.auth_users?.email || user.email || "N/A",
            class: data.class,
            date_of_birth: data.date_of_birth,
            gender: data.gender,
            mobile_number: data.mobile_number,
            role: data.role,
          });
        }
        setLoadingProfile(false);
      } else if (!sessionLoading) {
        // If no user and session is not loading, redirect to login
        navigate("/");
      }
    };

    fetchProfile();
  }, [user, sessionLoading, navigate]);

  if (sessionLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-background p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="w-full max-w-4xl mb-6">
          <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
        <Card className="w-full max-w-4xl shadow-lg rounded-lg text-center p-8">
          <CardHeader>
            <User className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold text-primary">My Profile</CardTitle>
            <CardDescription className="text-muted-foreground">
              Could not load profile details. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignOutButton />
          </CardContent>
        </Card>
        <BottomNavigationBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="w-full max-w-4xl mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
        <SignOutButton />
      </div>
      <Card className="w-full max-w-4xl shadow-lg rounded-lg p-8">
        <CardHeader className="text-center">
          <User className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">
            {profile.first_name} {profile.last_name}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <p className="text-lg text-foreground">Email: <span className="font-medium">{profile.email}</span></p>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <p className="text-lg text-foreground">Mobile: <span className="font-medium">{profile.mobile_number || "N/A"}</span></p>
          </div>
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <p className="text-lg text-foreground">Class: <span className="font-medium">{profile.class || "N/A"}</span></p>
          </div>
          <div className="flex items-center space-x-3">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <p className="text-lg text-foreground">Date of Birth: <span className="font-medium">{profile.date_of_birth || "N/A"}</span></p>
          </div>
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-muted-foreground" /> {/* Replaced Gender with User */}
            <p className="text-lg text-foreground">Gender: <span className="font-medium">{profile.gender || "N/A"}</span></p>
          </div>
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <p className="text-lg text-foreground">Role: <span className="font-medium capitalize">{profile.role || "N/A"}</span></p>
          </div>
          {/* Add an edit button here if you want to allow users to update their profile */}
          {/* <Button className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90">Edit Profile</Button> */}
        </CardContent>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default ProfilePage;