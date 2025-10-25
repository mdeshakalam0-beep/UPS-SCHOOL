"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, PlayCircle, Maximize2, Minimize2, Calendar, Clock, Video, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface RecordedClass {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  class: string;
  subject: string;
  created_at: string;
}

const RecordedVideoViewerPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [recordedClass, setRecordedClass] = useState<RecordedClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchRecordedClass = useCallback(async () => {
    if (!videoId) {
      setError("Video ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("recorded_classes")
      .select("*")
      .eq("id", videoId)
      .single();

    if (error) {
      console.error("Error fetching recorded class:", error);
      setError("Failed to load video details.");
      setRecordedClass(null);
    } else if (data) {
      setRecordedClass(data as RecordedClass);
    } else {
      setError("Video not found.");
      setRecordedClass(null);
    }
    setLoading(false);
  }, [videoId]);

  useEffect(() => {
    fetchRecordedClass();
  }, [fetchRecordedClass]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (videoRef.current) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        } else if ((videoRef.current as any).webkitRequestFullscreen) { /* Safari */
          (videoRef.current as any).webkitRequestFullscreen();
        } else if ((videoRef.current as any).msRequestFullscreen) { /* IE11 */
          (videoRef.current as any).msRequestFullscreen();
        }
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) { /* Safari */
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) { /* IE11 */
        (document as any).msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className={`min-h-screen flex flex-col ${isFullscreen ? 'p-0' : 'p-4 sm:p-6 lg:p-8 pb-20 md:pb-8'} bg-gradient-to-br from-slate-50 to-blue-50`}>
      {!isFullscreen && (
        <div className="w-full max-w-5xl mb-6">
          <Button variant="outline" onClick={() => navigate("/recorded-class")} className="flex items-center space-x-2 bg-white shadow-md hover:shadow-lg transition-shadow">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Recorded Classes</span>
          </Button>
        </div>
      )}
      
      <Card className={`w-full ${isFullscreen ? 'max-w-full h-full' : 'max-w-5xl'} shadow-xl rounded-2xl overflow-hidden`}>
        {!isFullscreen && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-white/20 p-3 rounded-full mr-4">
                  <Video className="h-10 w-10 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">{recordedClass?.title || "Video Viewer"}</CardTitle>
                  <CardDescription className="text-blue-100 mt-1">
                    {recordedClass?.description || "Loading video details..."}
                  </CardDescription>
                </div>
              </div>
              {recordedClass && (
                <div className="flex space-x-2">
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    {recordedClass.class}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    {recordedClass.subject}
                  </Badge>
                </div>
              )}
            </div>
            {recordedClass && (
              <div className="flex items-center text-sm text-blue-100 mt-4">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{format(new Date(recordedClass.created_at), "PPP")}</span>
                <Clock className="h-4 w-4 ml-4 mr-1" />
                <span>{format(new Date(recordedClass.created_at), "HH:mm")}</span>
              </div>
            )}
          </div>
        )}
        
        <CardContent className={`${isFullscreen ? 'p-0 h-full' : 'p-6'}`}>
          {loading ? (
            <div className="flex justify-center items-center h-60 bg-white rounded-xl shadow-sm border border-slate-200">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <span className="ml-3 text-lg text-slate-700">Loading video...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="w-20 h-20 bg-red-100 p-4 rounded-full mx-auto mb-4">
                <Video className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Error Loading Video</h3>
              <p className="text-slate-600 mb-4">{error}</p>
              <Button onClick={() => navigate("/recorded-class")} className="bg-blue-600 hover:bg-blue-700 text-white">
                Back to Recorded Classes
              </Button>
            </div>
          ) : (
            recordedClass?.video_url ? (
              <div className={`${isFullscreen ? 'h-full' : ''}`}>
                <div className={`relative ${isFullscreen ? 'h-full' : 'w-full max-w-[1280px] mx-auto'}`} style={{ paddingBottom: isFullscreen ? '0' : '56.25%' }}>
                  <video
                    ref={videoRef}
                    controls
                    src={recordedClass.video_url}
                    className={`absolute top-0 left-0 w-full ${isFullscreen ? 'h-full' : 'h-full'} rounded-md bg-black`}
                    poster="/placeholder.svg"
                  >
                    Your browser does not support the video tag.
                  </video>
                  {!isFullscreen && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="absolute bottom-4 right-4 bg-white/90 hover:bg-white shadow-md"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {!isFullscreen && recordedClass.description && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                      Description
                    </h3>
                    <p className="text-slate-600 whitespace-pre-wrap">{recordedClass.description}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                <Video className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Video Available</h3>
                <p className="text-slate-600">No video available for this class.</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
      {!isFullscreen && <BottomNavigationBar />}
    </div>
  );
};

export default RecordedVideoViewerPage;