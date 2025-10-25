"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Download, Loader2, FileText, Calendar, Clock, Eye } from "lucide-react";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
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

  const handleViewNote = (noteId: string) => {
    navigate(`/view-note/${noteId}`);
  };

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
              <BookOpen className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center">Notes & PDFs</CardTitle>
          <CardDescription className="text-blue-100 text-center mt-2">
            Access and download your study materials here.
          </CardDescription>
        </div>
        
        <CardContent className="p-8">
          {loading ? (
            <div className="flex justify-center items-center h-40 bg-white rounded-xl shadow-sm border border-slate-200">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <span className="ml-3 text-lg text-slate-700">Loading notes...</span>
            </div>
          ) : notes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                <Card key={note.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                        {note.class}
                      </Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                        {note.subject}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">{note.title}</h3>
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{note.description}</p>
                    <div className="flex items-center text-xs text-slate-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{format(new Date(note.created_at), "PPP")}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white">
                    <Button 
                      onClick={() => handleViewNote(note.id)} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <Eye className="mr-2 h-4 w-4" /> View Note
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="w-20 h-20 bg-slate-100 p-4 rounded-full mx-auto mb-4">
                <FileText className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Notes Available</h3>
              <p className="text-slate-600">No notes available at the moment.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default NotesPdfPage;