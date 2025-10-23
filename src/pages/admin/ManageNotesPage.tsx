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
  fileUrl: string; // Placeholder for file URL
  class: string;
  subject: string;
}

const mockNotes: Note[] = [
  { id: "n1", title: "Physics Chapter 1", description: "Introduction to Mechanics", fileUrl: "https://example.com/physics_ch1.pdf", class: "11th", subject: "Physics" },
  { id: "n2", title: "Maths Algebra Basics", description: "Equations and Inequalities", fileUrl: "https://example.com/maths_algebra.pdf", class: "10th", subject: "Mathematics" },
  { id: "n3", title: "History Mughal Empire", description: "Rise and Fall of Mughal Dynasty", fileUrl: "https://example.com/history_mughal.pdf", class: "9th", subject: "History" },
];

const ManageNotesPage = () => {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNoteData, setNewNoteData] = useState<Omit<Note, "id">>({
    title: "",
    description: "",
    fileUrl: "",
    class: "",
    subject: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewNoteData((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddNote = () => {
    if (!newNoteData.title || !newNoteData.class || !newNoteData.subject || !newNoteData.fileUrl) {
      showError("Please fill in all required fields (Title, Class, Subject, File URL).");
      return;
    }
    const newNote: Note = {
      ...newNoteData,
      id: String(notes.length + 1), // Simple ID generation
    };
    setNotes((prev) => [...prev, newNote]);
    showSuccess("Note added successfully!");
    setNewNoteData({ title: "", description: "", fileUrl: "", class: "", subject: "" });
    setIsDialogOpen(false);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNewNoteData({ ...note }); // Populate form with existing data
    setIsDialogOpen(true);
  };

  const handleUpdateNote = () => {
    if (!editingNote || !newNoteData.title || !newNoteData.class || !newNoteData.subject || !newNoteData.fileUrl) {
      showError("Please fill in all required fields (Title, Class, Subject, File URL).");
      return;
    }
    setNotes((prev) =>
      prev.map((n) => (n.id === editingNote.id ? { ...newNoteData, id: editingNote.id } : n))
    );
    showSuccess("Note updated successfully!");
    setEditingNote(null);
    setNewNoteData({ title: "", description: "", fileUrl: "", class: "", subject: "" });
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
    setNewNoteData({ title: "", description: "", fileUrl: "", class: "", subject: "" });
  };

  return (
    <Card className="w-full shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-primary">Manage Notes / PDFs</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingNote(null); setNewNoteData({ title: "", description: "", fileUrl: "", class: "", subject: "" }); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
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
                <Label htmlFor="fileUrl" className="text-right">
                  File URL
                </Label>
                <Input id="fileUrl" type="url" value={newNoteData.fileUrl} onChange={handleInputChange} className="col-span-3" />
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
              <TableHead>File URL</TableHead>
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
                  <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    View File
                  </a>
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