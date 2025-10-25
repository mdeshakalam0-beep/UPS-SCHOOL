"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, MonitorPlay, Loader2, User, CalendarDays, Clock, Link, Video, Users } from "lucide-react";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import { useSession } from "@/components/SessionContextProvider";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface LiveClass {
  id: string;
  title: string;
  description: string | null;
  meeting_link: string;
  class: string;
  scheduled_at: string; // ISO string
  duration_minutes: number | null;
  created_at: string;
  is_active: boolean; // Added is_active
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
      .eq("is_active", true) // Only fetch active classes for students
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

  const getClassStatusBadge = (classTime: Date, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="destructive" className="bg-red-100 text-red-700">Inactive</Badge>;
    } else if (isPast(classTime)) {
      return <Badge variant="secondary" className="bg-slate-100 text-slate-600">Ended</Badge>;
    } else if (isToday(classTime)) {
      return <Badge variant="secondary" className="bg-green-100 text-green-700">Today</Badge>;
    } else if (isTomorrow(classTime)) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Tomorrow</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-purple-100 text-purple-700">Upcoming</Badge>;
    }
  };

  if (sessionLoading || loadingClasses) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <span className="text-lg text-slate-700">Loading live classes...</span>
        </div>
      </div>
    );
  }

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
            <div className="w-20 h-20 bg-white/20 p-4 rounded-full">
              <MonitorPlay className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center">Live Classes</CardTitle>
          <CardDescription className="text-blue-100 text-center mt-2">
            यहां आपके क्लास ({userClass || 'N/A'}) के आगामी लाइव क्लास देखें।
          </CardDescription>
        </div>
        
        <CardContent className="p-8">
          {!userClass ? (
            <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-20 h-20 bg-amber-100 p-4 rounded-full mx-auto mb-4">
                <User className="h-12 w-12 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">आपकी क्लास की जानकारी नहीं मिली।</h3>
              <p className="text-slate-600 mb-6">लाइव क्लास देखने के लिए, कृपया अपनी प्रोफ़ाइल में अपनी क्लास अपडेट करें।</p>
              <Button onClick={() => navigate("/profile")} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                प्रोफ़ाइल अपडेट करें
              </Button>
            </div>
          ) : liveClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveClasses.map((lc) => {
                const classTime = new Date(lc.scheduled_at);
                const isClassOver = isPast(classTime);
                const isJoinDisabled = isClassOver || !lc.is_active; // Disable if over or inactive

                return (
                  <Card key={lc.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                          {lc.class}
                        </Badge>
                        {getClassStatusBadge(classTime, lc.is_active)}
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">{lc.title}</h3>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{lc.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center text-xs text-slate-500">
                          <CalendarDays className="h-3 w-3 mr-1" />
                          {format(classTime, "PPP")}
                        </div>
                        <div className="flex items-center text-xs text-slate-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(classTime, "HH:mm")} {lc.duration_minutes ? `(${lc.duration_minutes} min)` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <Button
                        variant={isJoinDisabled ? "secondary" : "default"}
                        className={`w-full font-medium py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ${
                          isJoinDisabled
                            ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                        onClick={() => handleJoinClass(lc.meeting_link)}
                        disabled={isJoinDisabled}
                      >
                        {isClassOver ? (
                          <>
                            <Video className="mr-2 h-4 w-4" /> Class Ended
                          </>
                        ) : !lc.is_active ? (
                          <>
                            <Video className="mr-2 h-4 w-4" /> Class Inactive
                          </>
                        ) : (
                          <>
                            <Link className="mr-2 h-4 w-4" /> Join Class
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-20 h-20 bg-slate-100 p-4 rounded-full mx-auto mb-4">
                <MonitorPlay className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Live Classes Scheduled</h3>
              <p className="text-slate-600">अभी आपकी क्लास के लिए कोई लाइव क्लास उपलब्ध नहीं है।</p>
            </div>
          )}
        </CardContent>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default LiveClassPage;