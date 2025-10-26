"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Video, Loader2, PlayCircle, User, Calendar, Clock, BookOpen, Filter } from "lucide-react";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import { useSession } from "@/components/SessionContextProvider";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components

interface RecordedClass {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  class: string;
  subject: string;
  created_at: string;
}

const subjects = [
  "Anthropology", "Biology", "Chemistry", "Civic Political Science", "Computer Science",
  "Disaster Management", "Economics", "English", "General", "Geography", "Hindi",
  "History", "Mathematics", "Physics", "Psychology", "Sanskrit", "Science", "Urdu"
];

const RecordedClassPage = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [recordedClasses, setRecordedClasses] = useState<RecordedClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [userClass, setUserClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null); // New state for selected subject

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

    // Fetch recorded classes filtered by user's class and selected subject
    let query = supabase
      .from("recorded_classes")
      .select("*")
      .eq("class", currentUserClass);
    
    if (selectedSubject) {
      query = query.eq("subject", selectedSubject);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching recorded classes:", error);
      showError("Failed to load recorded classes.");
    } else {
      setRecordedClasses(data as RecordedClass[]);
    }
    setLoadingClasses(false);
  }, [user, selectedSubject]); // Add selectedSubject to dependencies

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <span className="text-lg text-slate-700">Loading recorded classes...</span>
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
              <Video className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center">Recorded Classes</CardTitle>
          <CardDescription className="text-blue-100 text-center mt-2">
            यहां आपके क्लास ({userClass || 'N/A'}) के रिकॉर्डेड क्लास वीडियो देखें।
          </CardDescription>
        </div>
        
        <CardContent className="p-8">
          {!userClass ? (
            <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-20 h-20 bg-amber-100 p-4 rounded-full mx-auto mb-4">
                <User className="h-12 w-12 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">आपकी क्लास की जानकारी नहीं मिली।</h3>
              <p className="text-slate-600 mb-6">रिकॉर्डेड क्लास देखने के लिए, कृपया अपनी प्रोफ़ाइल में अपनी क्लास अपडेट करें।</p>
              <Button onClick={() => navigate("/profile")} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                प्रोफ़ाइल अपडेट करें
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-md p-2 flex items-center space-x-2 w-full md:w-1/2 lg:w-1/3">
                  <Filter className="h-5 w-5 text-blue-600 ml-2" />
                  <Select onValueChange={(value) => setSelectedSubject(value === "all" ? null : value)} value={selectedSubject || "all"}>
                    <SelectTrigger className="border-0 focus:ring-0">
                      <SelectValue placeholder="Filter by Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {recordedClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recordedClasses.map((rc) => (
                    <Card key={rc.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                            {rc.class}
                          </Badge>
                          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                            {rc.subject}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">{rc.title}</h3>
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{rc.description}</p>
                        <div className="flex items-center text-xs text-slate-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(rc.created_at), "PPP")}
                        </div>
                      </div>
                      <div className="p-4 bg-white">
                        <Button 
                          onClick={() => handleViewVideo(rc.id)} 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          <PlayCircle className="mr-2 h-4 w-4" /> View Video
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-20 h-20 bg-slate-100 p-4 rounded-full mx-auto mb-4">
                    <Video className="h-12 w-12 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">No Recorded Classes Available</h3>
                  <p className="text-slate-600">
                    {selectedSubject ? `आपके क्लास में ${selectedSubject} विषय के लिए कोई रिकॉर्डेड क्लास उपलब्ध नहीं है।` : "अभी आपकी क्लास के लिए कोई रिकॉर्डेड क्लास उपलब्ध नहीं है।"}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default RecordedClassPage;