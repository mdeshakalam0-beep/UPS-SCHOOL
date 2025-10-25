"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Video, Loader2, PlayCircle, User } from "lucide-react"; // Added User icon
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import { useSession } from "@/components/SessionContextProvider";

interface RecordedClass {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  class: string;
  subject: string;
  created_at: string;
}

const RecordedClassPage = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [recordedClasses, setRecordedClasses] = useState<RecordedClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [userClass, setUserClass] = useState<string | null>(null);

  const fetchUserClassAndRecordedClasses = useCallback(async () => {
    setLoadingClasses(true);
    if (!user) {
      setLoadingClasses(false);
      return;
    }

    // Fetch user's class from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('class')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means "no rows found" for single()
      console.error("Error fetching user profile:", profileError);
      showError("Failed to load user profile to filter classes.");
      setUserClass(null); // Ensure userClass is null on error
      setLoadingClasses(false);
      return;
    }

    const currentUserClass = profile?.class;
    setUserClass(currentUserClass);

    if (!currentUserClass) {
      console.warn("User class not found. Cannot filter recorded classes.");
      setRecordedClasses([]); // Clear classes if user class is not found
      setLoadingClasses(false);
      return;
    }

    // Fetch recorded classes filtered by user's class
    const { data, error } = await supabase
      .from("recorded_classes")
      .select("*")
      .eq("class", currentUserClass)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching recorded classes:", error);
      showError("Failed to load recorded classes.");
    } else {
      setRecordedClasses(data as RecordedClass[]);
    }
    setLoadingClasses(false);
  }, [user]);

  useEffect(() => {
    if (!sessionLoading) {
      fetchUserClassAndRecordedClasses();
    }
  }, [sessionLoading, fetchUserClassAndRecordedClasses]);

  const handleViewVideo = (videoId: string) => {
    navigate(`/view-recorded-class/${videoId}`);
  };

  if (sessionLoading || loadingClasses) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading recorded classes...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="w-full max-w-4xl mb-6">
        <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>
      <Card className="w-full max-w-4xl shadow-lg rounded-lg p-8">
        <CardHeader className="text-center">
          <Video className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">Recorded Classes</CardTitle>
          <CardDescription className="text-muted-foreground">
            यहां आपके क्लास ({userClass || 'N/A'}) के रिकॉर्डेड क्लास वीडियो देखें।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!userClass ? (
            <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-md">
              <User className="h-10 w-10 text-yellow-600 mx-auto mb-3" />
              <p className="text-lg font-semibold text-yellow-800 mb-2">आपकी क्लास की जानकारी नहीं मिली।</p>
              <p className="text-muted-foreground mb-4">रिकॉर्डेड क्लास देखने के लिए, कृपया अपनी प्रोफ़ाइल में अपनी क्लास अपडेट करें।</p>
              <Button onClick={() => navigate("/profile")} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                प्रोफ़ाइल अपडेट करें
              </Button>
            </div>
          ) : recordedClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recordedClasses.map((rc) => (
                <Card key={rc.id} className="p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{rc.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{rc.description}</p>
                    <p className="text-xs text-gray-500">Class: {rc.class} | Subject: {rc.subject}</p>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" onClick={() => handleViewVideo(rc.id)}>
                      <PlayCircle className="mr-2 h-4 w-4" /> View Video
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-lg text-muted-foreground">अभी आपकी क्लास के लिए कोई रिकॉर्डेड क्लास उपलब्ध नहीं है।</p>
          )}
        </CardContent>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default RecordedClassPage;