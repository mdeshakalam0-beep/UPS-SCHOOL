"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, Download, Calendar, Clock, BookOpen, FileText, Maximize2, Minimize2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderFileContent = () => {
    if (!note?.file_url) {
      return (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No file available for this note.</p>
        </div>
      );
    }

    const fileExtension = note.file_url.split(".").pop()?.toLowerCase();

    if (fileExtension === "pdf") {
      return (
        <div className="relative bg-white rounded-lg shadow-md overflow-hidden" style={{ height: isFullscreen ? '80vh' : '70vh' }}>
          <div className="absolute top-2 right-2 z-10 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="bg-white/90 hover:bg-white shadow-md"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <a href={note.file_url} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90 hover:bg-white shadow-md"
              >
                <Download className="h-4 w-4" />
              </Button>
            </a>
          </div>
          <iframe
            src={note.file_url}
            title={note.title}
            className="w-full h-full border-none"
            allowFullScreen
          >
            This browser does not support PDFs. Please download the PDF to view it:{" "}
            <a href={note.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Download PDF</a>.
          </iframe>
        </div>
      );
    } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension || "")) {
      return (
        <div className="relative bg-white rounded-lg shadow-md overflow-hidden" style={{ height: isFullscreen ? '80vh' : '70vh' }}>
          <div className="absolute top-2 right-2 z-10 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="bg-white/90 hover:bg-white shadow-md"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <a href={note.file_url} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90 hover:bg-white shadow-md"
              >
                <Download className="h-4 w-4" />
              </Button>
            </a>
          </div>
          <div className="h-full flex items-center justify-center p-4">
            <img
              src={note.file_url}
              alt={note.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">Unsupported file type. Please download to view.</p>
          <a href={note.file_url} target="_blank" rel="noopener noreferrer">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="mr-2 h-4 w-4" /> Download File
            </Button>
          </a>
        </div>
      );
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isFullscreen ? 'p-4' : 'p-4 sm:p-6 lg:p-8 pb-20 md:pb-8'} bg-gradient-to-br from-slate-50 to-blue-50`}>
      {!isFullscreen && (
        <div className="w-full max-w-5xl mb-6">
          <Button variant="outline" onClick={() => navigate("/notes-pdf")} className="flex items-center space-x-2 bg-white shadow-md hover:shadow-lg transition-shadow">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Notes</span>
          </Button>
        </div>
      )}
      
      <Card className={`w-full ${isFullscreen ? 'max-w-full' : 'max-w-5xl'} shadow-xl rounded-2xl overflow-hidden`}>
        {!isFullscreen && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-white/20 p-3 rounded-full mr-4">
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">{note?.title || "Note Viewer"}</CardTitle>
                  <CardDescription className="text-blue-100 mt-1">
                    {note?.description || "Loading note details..."}
                  </CardDescription>
                </div>
              </div>
              {note && (
                <div className="flex space-x-2">
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    {note.class}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    {note.subject}
                  </Badge>
                </div>
              )}
            </div>
            {note && (
              <div className="flex items-center text-sm text-blue-100 mt-4">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{format(new Date(note.created_at), "PPP")}</span>
                <Clock className="h-4 w-4 ml-4 mr-1" />
                <span>{format(new Date(note.created_at), "HH:mm")}</span>
              </div>
            )}
          </div>
        )}
        
        <CardContent className={`${isFullscreen ? 'p-0' : 'p-6'}`}>
          {loading ? (
            <div className="flex justify-center items-center h-60 bg-white rounded-xl shadow-sm border border-slate-200">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <span className="ml-3 text-lg text-slate-700">Loading note content...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="w-20 h-20 bg-red-100 p-4 rounded-full mx-auto mb-4">
                <FileText className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Error Loading Note</h3>
              <p className="text-slate-600 mb-4">{error}</p>
              <Button onClick={() => navigate("/notes-pdf")} className="bg-blue-600 hover:bg-blue-700 text-white">
                Back to Notes
              </Button>
            </div>
          ) : (
            renderFileContent()
          )}
        </CardContent>
      </Card>
      {!isFullscreen && <BottomNavigationBar />}
    </div>
  );
};

export default NoteViewerPage;