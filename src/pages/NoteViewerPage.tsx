"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import BottomNavigationBar from "@/components/BottomNavigationBar";

interface Note {
  id: string;
  title: string;
  description: string;
  file_url: string;
  class: string;
  subject: string;
  created_at: string;
}

const NoteViewerPage = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNote = useCallback(async () => {
    if (!noteId) {
      setError("Note ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("id", noteId)
      .single();

    if (error) {
      console.error("Error fetching note:", error);
      setError("Failed to load note details.");
      setNote(null);
    } else if (data) {
      setNote(data as Note);
    } else {
      setError("Note not found.");
      setNote(null);
    }
    setLoading(false);
  }, [noteId]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  const renderFileContent = () => {
    if (!note?.file_url) {
      return <p className="text-muted-foreground">No file available for this note.</p>;
    }

    const fileExtension = note.file_url.split(".").pop()?.toLowerCase();

    if (fileExtension === "pdf") {
      return (
        <iframe
          src={note.file_url}
          title={note.title}
          className="w-full h-[70vh] border-none rounded-md"
          allowFullScreen
        >
          This browser does not support PDFs. Please download the PDF to view it:{" "}
          <a href={note.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Download PDF</a>.
        </iframe>
      );
    } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension || "")) {
      return (
        <img
          src={note.file_url}
          alt={note.title}
          className="max-w-full h-auto rounded-md object-contain mx-auto"
          style={{ maxHeight: '70vh' }}
        />
      );
    } else {
      return (
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Unsupported file type. Please download to view.</p>
          <a href={note.file_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Download File</Button>
          </a>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="w-full max-w-4xl mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate("/notes-pdf")} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Notes</span>
        </Button>
      </div>
      <Card className="w-full max-w-4xl shadow-lg rounded-lg p-8">
        <CardHeader className="text-center">
          {loading ? (
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          ) : error ? (
            <p className="text-destructive text-lg">{error}</p>
          ) : (
            <>
              <CardTitle className="text-3xl font-bold text-primary">{note?.title}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {note?.description}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-60">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading note content...</span>
            </div>
          ) : error ? (
            <div className="text-center text-destructive text-lg">{error}</div>
          ) : (
            renderFileContent()
          )}
        </CardContent>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default NoteViewerPage;