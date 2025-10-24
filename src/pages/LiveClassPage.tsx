"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, MonitorPlay, Loader2, User, CalendarDays, Clock, Link } from "lucide-react";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import { useSession } from "@/components/SessionContextProvider";
import { format, isPast } from "date-fns";

interface LiveClass {
  id: string;
  title: string;
  description: string | null;
  meeting_link: string;
  class: string;
  scheduled_at: string; // ISO string
  duration_minutes: number | null;
  created_at: string;
}

const LiveClassPage = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [userClass, setUserClass] = useState<string | null>(null);

  const fetchUserClassAndLiveClasses = useCallback(async () => {
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

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error fetching user profile:", profileError);
      showError("Failed to load user profile to filter classes.");
      setUserClass(null);
      setLoadingClasses(false);
      return;
    }

    const currentUserClass = profile?.class;
    setUserClass(currentUserClass);

    if (!currentUserClass) {
      console.warn("User class not found. Cannot filter live classes.");
      setLiveClasses([]);
      setLoadingClasses(false);
      return;
    }

    // Fetch live classes filtered by user's class, ordered by scheduled_at
    const { data, error } = await supabase
      .from("live_classes")
      .select("*")
      .eq("class", currentUserClass)
      .order("scheduled_at", { ascending: true }); // Order by upcoming classes

    if (error) {
      console.error("Error fetching live classes:", error);
      showError("Failed to load live classes.");
    } else {
      setLiveClasses(data as LiveClass[]);
    }
    setLoadingClasses(false);
  }, [user]);

  useEffect(() => {
    if (!sessionLoading) {
      fetchUserClassAndLiveClasses();
    }
  }, [sessionLoading, fetchUserClassAndLiveClasses]);

  const handleJoinClass = (meetingLink: string) => {
    window.open(meetingLink, "_blank");
  };

  if (sessionLoading || loadingClasses) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading live classes...</span>
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
          <MonitorPlay className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">Live Classes</CardTitle>
          <CardDescription className="text-muted-foreground">
            यहां आपके क्लास ({userClass || 'N/A'}) के आगामी लाइव क्लास देखें।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!userClass ? (
            <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-md">
              <User className="h-10 w-10 text-yellow-600 mx-auto mb-3" />
              <p className="text-lg font-semibold text-yellow-800 mb-2">आपकी क्लास की जानकारी नहीं मिली।</p>
              <p className="text-muted-foreground mb-4">लाइव क्लास देखने के लिए, कृपया अपनी प्रोफ़ाइल में अपनी क्लास अपडेट करें।</p>
              <Button onClick={() => navigate("/profile")} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                प्रोफ़ाइल अपडेट करें
              </Button>
            </div>
          ) : liveClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveClasses.map((lc) => {
                const classTime = new Date(lc.scheduled_at);
                const isClassOver = isPast(classTime);
                return (
                  <Card key={lc.id} className="p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">{lc.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{lc.description}</p>
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <CalendarDays className="h-3 w-3 mr-1" />
                        <span>{format(classTime, "PPP")}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{format(classTime, "HH:mm")} {lc.duration_minutes ? `(${lc.duration_minutes} min)` : ''}</span>
                      </div>
                      <p className="text-xs text-gray-500">Class: {lc.class}</p>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant={isClassOver ? "secondary" : "default"}
                        className="w-full"
                        onClick={() => handleJoinClass(lc.meeting_link)}
                        disabled={isClassOver}
                      >
                        {isClassOver ? "Class Ended" : <><Link className="mr-2 h-4 w-4" /> Join Class</>}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-lg text-muted-foreground">अभी आपकी क्लास के लिए कोई लाइव क्लास उपलब्ध नहीं है।</p>
          )}
        </CardContent>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default LiveClassPage;