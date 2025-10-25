"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, PlayCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import BottomNavigationBar from "@/components/BottomNavigationBar";

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

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="w-full max-w-4xl mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate("/recorded-class")} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Recorded Classes</span>
        </Button>
      </div>
      <Card className="w-full max-w-4xl shadow-lg rounded-lg p-8">
        <CardHeader className="text-center pb-4">
          {loading ? (
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          ) : error ? (
            <p className="text-destructive text-lg">{error}</p>
          ) : (
            <CardTitle className="text-3xl font-bold text-primary text-left">
              {recordedClass?.title}
            </CardTitle>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-60">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading video...</span>
            </div>
          ) : error ? (
            <div className="text-center text-destructive text-lg">{error}</div>
          ) : (
            recordedClass?.video_url ? (
              <>
                {/* Added max-w-[1280px] and mx-auto to constrain the video size */}
                <div className="relative w-full max-w-[1280px] mx-auto" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
                  <video
                    controls
                    src={recordedClass.video_url}
                    className="absolute top-0 left-0 w-full h-full rounded-md bg-black"
                    poster="/placeholder.svg" // You can add a placeholder image here
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                {recordedClass.description && (
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{recordedClass.description}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-center">No video available for this class.</p>
            )
          )}
        </CardContent>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default RecordedVideoViewerPage;