"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { BookOpen, Pencil, Trash2, PlusCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Note {
  id: string;
  title: string;
  description: string;
  // For now, file will be stored as a File object in state,
  // but for persistence, this would be a URL from Supabase Storage.
  file: File | null; 
  fileUrlDisplay: string; // To display the file name or URL if already uploaded
  class: string;
  subject: string;
}

// Mock data for notes. In a real app, 'file' would be a URL from storage.
const mockNotes: Note[] = [
  { id: "n1", title: "Physics Chapter 1", description: "Introduction to Mechanics", file: null, fileUrlDisplay: "physics_ch1.pdf", class: "11th", subject: "Physics" },
  { id: "n2", title: "Maths Algebra Basics", description: "Equations and Inequalities", file: null, fileUrlDisplay: "maths_algebra.pdf", class: "10th", subject: "Mathematics" },
  { id: "n3", title: "History Mughal Empire", description: "Rise and Fall of Mughal Dynasty", file: null, fileUrlDisplay: "history_mughal.pdf", class: "9th", subject: "History" },
];

const ManageNotesPage = () => {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNoteData, setNewNoteData] = useState<Omit<Note, "id">>({
    title: "",
    description: "",
    file: null,
    fileUrlDisplay: "",
    class: "",
    subject: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, files } = e.target;
    if (id === "file" && files && files.length > 0) {
      setNewNoteData((prev) => ({ ...prev, file: files[0], fileUrlDisplay: files[0].name }));
    } else {
      setNewNoteData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleAddNote = () => {
    if (!newNoteData.title || !newNoteData.class || !newNoteData.subject || !newNoteData.file) {
      showError("Please fill in all required fields (Title, Class, Subject, and upload a File).");
      return;
    }
    // In a real app with Supabase, you would upload newNoteData.file here
    // and get a fileUrl back to store in the database.
    const newNote: Note = {
      ...newNoteData,
      id: String(notes.length + 1), // Simple ID generation
      fileUrlDisplay: newNoteData.file?.name || "", // Display file name
    };
    setNotes((prev) => [...prev, newNote]);
    showSuccess("Note added successfully! (File not actually uploaded to server yet)");
    setNewNoteData({ title: "", description: "", file: null, fileUrlDisplay: "", class: "", subject: "" });
    setIsDialogOpen(false);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNewNoteData({ ...note, file: null }); // Don't pre-fill file input, user must re-upload if changing
    setIsDialogOpen(true);
  };

  const handleUpdateNote = () => {
    if (!editingNote || !newNoteData.title || !newNoteData.class || !newNoteData.subject) {
      showError("Please fill in all required fields (Title, Class, Subject).");
      return;
    }
    // If newNoteData.file exists, it means a new file was selected and needs to be uploaded.
    // Otherwise, keep the existing fileUrlDisplay.
    const updatedFileUrlDisplay = newNoteData.file ? newNoteData.file.name : editingNote.fileUrlDisplay;

    setNotes((prev) =>
      prev.map((n) =>
        n.id === editingNote.id
          ? { ...newNoteData, id: editingNote.id, file: newNoteData.file, fileUrlDisplay: updatedFileUrlDisplay }
          : n
      )
    );
    showSuccess("Note updated successfully! (File not actually uploaded to server yet)");
    setEditingNote(null);
    setNewNoteData({ title: "", description: "", file: null, fileUrlDisplay: "", class: "", subject: "" });
    setIsDialogOpen(false);
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      showSuccess("Note deleted successfully!");
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingNote(null);
    setNewNoteData({ title: "", description: "", file: null, fileUrlDisplay: "", class: "", subject: "" });
  };

  return (
    <Card className="w-full shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-primary">Manage Notes / PDFs</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingNote(null); setNewNoteData({ title: "", description: "", file: null, fileUrlDisplay: "", class: "", subject: "" }); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
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
                {newNoteData.fileUrlDisplay && (
                  <div className="col-span-4 text-sm text-muted-foreground text-right">
                    Current: {newNoteData.fileUrlDisplay}
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
              <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
              <Button onClick={editingNote ? handleUpdateNote : handleAddNote} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {editingNote ? "Save Changes" : "Add Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
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
            {notes.map((note) => (
              <TableRow key={note.id}>
                <TableCell className="font-medium">{note.title}</TableCell>
                <TableCell>{note.class}</TableCell>
                <TableCell>{note.subject}</TableCell>
                <TableCell>
                  {/* In a real app, this would be a link to the file's URL from storage */}
                  {note.fileUrlDisplay || "No file"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEditNote(note)} className="mr-2">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteNote(note.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {notes.length === 0 && (
          <p className="text-center text-muted-foreground mt-4">No notes found. Add a new note to get started!</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageNotesPage;