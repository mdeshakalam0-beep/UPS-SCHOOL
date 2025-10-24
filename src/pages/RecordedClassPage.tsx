"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Video, Loader2 } from "lucide-react";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";

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
  const [recordedClasses, setRecordedClasses] = useState<RecordedClass[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecordedClasses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recorded_classes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching recorded classes:", error);
      showError("Failed to load recorded classes.");
    } else {
      setRecordedClasses(data as RecordedClass[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecordedClasses();
  }, [fetchRecordedClasses]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
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
            यहां अपने रिकॉर्डेड क्लास वीडियो देखें।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading recorded classes...</span>
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
                    <video controls src={rc.video_url} className="w-full h-auto rounded-md" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-lg text-muted-foreground">अभी कोई रिकॉर्डेड क्लास उपलब्ध नहीं है।</p>
          )}
        </CardContent>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default RecordedClassPage;