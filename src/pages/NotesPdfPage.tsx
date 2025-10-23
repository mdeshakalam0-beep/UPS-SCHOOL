"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Download, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient"; // Supabase क्लाइंट इम्पोर्ट करें
import { showError } from "@/utils/toast";

interface Note {
  id: string;
  title: string;
  description: string;
  file_url: string;
  class: string;
  subject: string;
  created_at: string;
}

const NotesPdfPage = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching notes:", error);
      showError("Failed to load notes.");
    } else {
      setNotes(data as Note[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>
      <Card className="w-full max-w-4xl shadow-lg rounded-lg p-8">
        <CardHeader className="text-center">
          <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">Notes & PDFs</CardTitle>
          <CardDescription className="text-muted-foreground">
            Access and download your study materials here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading notes...</span>
            </div>
          ) : notes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <Card key={note.id} className="p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{note.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{note.description}</p>
                    <p className="text-xs text-gray-500">Class: {note.class} | Subject: {note.subject}</p>
                  </div>
                  <div className="mt-4">
                    <a href={note.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" /> Download / View
                      </Button>
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-lg text-muted-foreground">No notes available at the moment.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotesPdfPage;