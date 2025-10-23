"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { BookOpen, Pencil, Trash2, PlusCircle, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/components/SessionContextProvider"; // Import useSession

interface Note {
  id: string;
  title: string;
  description: string;
  file_url: string; // Supabase Storage से फाइल का URL
  class: string;
  subject: string;
  created_at: string;
  user_id: string; // Added user_id
}

const ManageNotesPage = () => {
  const { user } = useSession(); // Get current user from session
  const [notes, setNotes] = useState<Note[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNoteData, setNewNoteData] = useState<{
    title: string;
    description: string;
    file: File | null;
    class: string;
    subject: string;
  }>({
    title: "",
    description: "",
    file: null,
    class: "",
    subject: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, files } = e.target;
    if (id === "file" && files && files.length > 0) {
      setNewNoteData((prev) => ({ ...prev, file: files[0] }));
    } else {
      setNewNoteData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `notes/${fileName}`;

    const { data, error } = await supabase.storage.from("notes_bucket").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from("notes_bucket").getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const handleAddNote = async () => {
    setIsSubmitting(true);
    if (!newNoteData.title || !newNoteData.class || !newNoteData.subject || !newNoteData.file) {
      showError("Please fill in all required fields (Title, Class, Subject, and upload a File).");
      setIsSubmitting(false);
      return;
    }
    if (!user) {
      showError("You must be logged in to add a note.");
      setIsSubmitting(false);
      return;
    }

    try {
      const fileUrl = await uploadFile(newNoteData.file);

      const { error } = await supabase.from("notes").insert({
        title: newNoteData.title,
        description: newNoteData.description,
        file_url: fileUrl,
        class: newNoteData.class,
        subject: newNoteData.subject,
        user_id: user.id, // Include user_id here
      });

      if (error) {
        throw error;
      }

      showSuccess("Note added successfully!");
      fetchNotes();
      handleDialogClose();
    } catch (error: any) {
      console.error("Error adding note:", error.message);
      showError(`Failed to add note: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNewNoteData({ ...note, file: null }); // Don't pre-fill file input, user must re-upload if changing
    setIsDialogOpen(true);
  };

  const handleUpdateNote = async () => {
    setIsSubmitting(true);
    if (!editingNote || !newNoteData.title || !newNoteData.class || !newNoteData.subject) {
      showError("Please fill in all required fields (Title, Class, Subject).");
      setIsSubmitting(false);
      return;
    }

    try {
      let fileUrl = editingNote.file_url;
      if (newNoteData.file) {
        // If a new file is selected, upload it and get the new URL
        fileUrl = await uploadFile(newNoteData.file);
        // Optionally, delete the old file from storage if it's no longer needed
        // const oldFilePath = editingNote.file_url.split('/').pop();
        // if (oldFilePath) await supabase.storage.from('notes_bucket').remove([`notes/${oldFilePath}`]);
      }

      const { error } = await supabase
        .from("notes")
        .update({
          title: newNoteData.title,
          description: newNoteData.description,
          file_url: fileUrl,
          class: newNoteData.class,
          subject: newNoteData.subject,
        })
        .eq("id", editingNote.id);

      if (error) {
        throw error;
      }

      showSuccess("Note updated successfully!");
      fetchNotes();
      handleDialogClose();
    } catch (error: any) {
      console.error("Error updating note:", error.message);
      showError(`Failed to update note: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (note: Note) => {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      // Delete file from Supabase Storage
      const filePath = note.file_url.split('/').pop(); // Extract file name from URL
      if (filePath) {
        const { error: storageError } = await supabase.storage.from("notes_bucket").remove([`notes/${filePath}`]);
        if (storageError) {
          console.error("Error deleting file from storage:", storageError);
          // Don't throw, try to delete the database record anyway
        }
      }

      // Delete record from Supabase database
      const { error: dbError } = await supabase.from("notes").delete().eq("id", note.id);

      if (dbError) {
        throw dbError;
      }

      showSuccess("Note deleted successfully!");
      fetchNotes();
    } catch (error: any) {
      console.error("Error deleting note:", error.message);
      showError(`Failed to delete note: ${error.message}`);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingNote(null);
    setNewNoteData({ title: "", description: "", file: null, class: "", subject: "" });
  };

  return (
    <Card className="w-full shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-primary">Manage Notes / PDFs</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingNote(null); setNewNoteData({ title: "", description: "", file: null, class: "", subject: "" }); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Edit Note" : "Add New Note"}</DialogTitle>
              <CardDescription>{editingNote ? "Update note details." : "Enter new note information."}</CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input id="title" value={newNoteData.title} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea id="description" value={newNoteData.description} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file" className="text-right">
                  Upload File
                </Label>
                <Input id="file" type="file" accept=".pdf,image/*,video/*" onChange={handleInputChange} className="col-span-3" />
                {editingNote?.file_url && !newNoteData.file && (
                  <div className="col-span-4 text-sm text-muted-foreground text-right">
                    Current File: <a href={editingNote.file_url} target="_blank" rel="noopener noreferrer" className="underline">{editingNote.file_url.split('/').pop()}</a>
                  </div>
                )}
                {newNoteData.file && (
                  <div className="col-span-4 text-sm text-muted-foreground text-right">
                    Selected: {newNoteData.file.name}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class" className="text-right">
                  Class
                </Label>
                <Input id="class" value={newNoteData.class} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  Subject
                </Label>
                <Input id="subject" value={newNoteData.subject} onChange={handleInputChange} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={editingNote ? handleUpdateNote : handleAddNote} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingNote ? "Save Changes" : "Add Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading notes...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.length > 0 ? (
                notes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium">{note.title}</TableCell>
                    <TableCell>{note.class}</TableCell>
                    <TableCell>{note.subject}</TableCell>
                    <TableCell>
                      <a href={note.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {note.file_url.split('/').pop()}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditNote(note)} className="mr-2">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteNote(note)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                    No notes found. Add a new note to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageNotesPage;