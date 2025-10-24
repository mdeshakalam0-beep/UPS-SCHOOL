"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { Video, Pencil, Trash2, PlusCircle, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/components/SessionContextProvider";

interface RecordedClass {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  class: string;
  subject: string;
  uploaded_by: string | null;
  created_at: string;
}

const ManageRecordedClassesPage = () => {
  const { user } = useSession();
  const [recordedClasses, setRecordedClasses] = useState<RecordedClass[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<RecordedClass | null>(null);
  const [newClassData, setNewClassData] = useState<{
    title: string;
    description: string;
    videoFile: File | null;
    class: string;
    subject: string;
  }>({
    title: "",
    description: "",
    videoFile: null,
    class: "",
    subject: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, files } = e.target;
    if (id === "videoFile" && files && files.length > 0) {
      setNewClassData((prev) => ({ ...prev, videoFile: files[0] }));
    } else {
      setNewClassData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const uploadVideo = async (file: File, existingVideoUrl?: string | null) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `public/${fileName}`; // Store in a 'public' folder within the bucket

    // If there's an existing video, try to delete it first
    if (existingVideoUrl) {
      const oldFileName = existingVideoUrl.split('/').pop();
      if (oldFileName) {
        const { error: deleteError } = await supabase.storage.from('recorded_classes_bucket').remove([`public/${oldFileName}`]);
        if (deleteError) {
          console.warn("Failed to delete old video file:", deleteError.message);
          // Don't throw, continue with new upload
        }
      }
    }

    const { data, error } = await supabase.storage.from("recorded_classes_bucket").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false, // Do not upsert, create new file
    });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from("recorded_classes_bucket").getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const handleAddClass = async () => {
    setIsSubmitting(true);
    if (!newClassData.title || !newClassData.class || !newClassData.subject || !newClassData.videoFile) {
      showError("Please fill in all required fields (Title, Class, Subject, and upload a Video File).");
      setIsSubmitting(false);
      return;
    }
    if (!user) {
      showError("You must be logged in to add a recorded class.");
      setIsSubmitting(false);
      return;
    }

    try {
      const videoUrl = await uploadVideo(newClassData.videoFile);

      const { error } = await supabase.from("recorded_classes").insert({
        title: newClassData.title,
        description: newClassData.description,
        video_url: videoUrl,
        class: newClassData.class,
        subject: newClassData.subject,
        uploaded_by: user.id,
      });

      if (error) {
        throw error;
      }

      showSuccess("Recorded class added successfully!");
      fetchRecordedClasses();
      handleDialogClose();
    } catch (error: any) {
      console.error("Error adding recorded class:", error.message);
      showError(`Failed to add recorded class: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClass = (recordedClass: RecordedClass) => {
    setEditingClass(recordedClass);
    setNewClassData({
      title: recordedClass.title,
      description: recordedClass.description || "",
      videoFile: null, // User must re-upload if changing video
      class: recordedClass.class,
      subject: recordedClass.subject,
    });
    setIsDialogOpen(true);
  };

  const handleUpdateClass = async () => {
    setIsSubmitting(true);
    if (!editingClass || !newClassData.title || !newClassData.class || !newClassData.subject) {
      showError("Please fill in all required fields (Title, Class, Subject).");
      setIsSubmitting(false);
      return;
    }

    try {
      let videoUrl = editingClass.video_url;
      if (newClassData.videoFile) {
        // Upload new video and get its URL, deleting the old one
        videoUrl = await uploadVideo(newClassData.videoFile, editingClass.video_url);
      }

      const { error } = await supabase
        .from("recorded_classes")
        .update({
          title: newClassData.title,
          description: newClassData.description,
          video_url: videoUrl,
          class: newClassData.class,
          subject: newClassData.subject,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingClass.id);

      if (error) {
        throw error;
      }

      showSuccess("Recorded class updated successfully!");
      fetchRecordedClasses();
      handleDialogClose();
    } catch (error: any) {
      console.error("Error updating recorded class:", error.message);
      showError(`Failed to update recorded class: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (recordedClass: RecordedClass) => {
    if (!window.confirm("Are you sure you want to delete this recorded class? This will also delete its video file.")) {
      return;
    }

    try {
      // Delete video file from Supabase Storage
      const fileName = recordedClass.video_url.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage.from("recorded_classes_bucket").remove([`public/${fileName}`]);
        if (storageError) {
          console.warn("Error deleting video file from storage:", storageError.message);
          // Don't throw, try to delete the database record anyway
        }
      }

      // Delete record from Supabase database
      const { error: dbError } = await supabase.from("recorded_classes").delete().eq("id", recordedClass.id);

      if (dbError) {
        throw dbError;
      }

      showSuccess("Recorded class deleted successfully!");
      fetchRecordedClasses();
    } catch (error: any) {
      console.error("Error deleting recorded class:", error.message);
      showError(`Failed to delete recorded class: ${error.message}`);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingClass(null);
    setNewClassData({ title: "", description: "", videoFile: null, class: "", subject: "" });
  };

  return (
    <Card className="w-full shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-primary">Manage Recorded Classes</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingClass(null); setNewClassData({ title: "", description: "", videoFile: null, class: "", subject: "" }); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingClass ? "Edit Recorded Class" : "Add New Recorded Class"}</DialogTitle>
              <CardDescription>{editingClass ? "Update class details." : "Enter new class information and upload video."}</CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input id="title" value={newClassData.title} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea id="description" value={newClassData.description} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="videoFile" className="text-right">
                  Upload Video
                </Label>
                <Input id="videoFile" type="file" accept="video/*" onChange={handleInputChange} className="col-span-3" />
                {editingClass?.video_url && !newClassData.videoFile && (
                  <div className="col-span-4 text-sm text-muted-foreground text-right">
                    Current: <a href={editingClass.video_url} target="_blank" rel="noopener noreferrer" className="underline">{editingClass.video_url.split('/').pop()}</a>
                  </div>
                )}
                {newClassData.videoFile && (
                  <div className="col-span-4 text-sm text-muted-foreground text-right">
                    Selected: {newClassData.videoFile.name}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class" className="text-right">
                  Class
                </Label>
                <Input id="class" value={newClassData.class} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  Subject
                </Label>
                <Input id="subject" value={newClassData.subject} onChange={handleInputChange} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={editingClass ? handleUpdateClass : handleAddClass} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingClass ? "Save Changes" : "Add Class"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading recorded classes...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Video</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recordedClasses.length > 0 ? (
                recordedClasses.map((rc) => (
                  <TableRow key={rc.id}>
                    <TableCell className="font-medium">{rc.title}</TableCell>
                    <TableCell>{rc.class}</TableCell>
                    <TableCell>{rc.subject}</TableCell>
                    <TableCell>
                      <a href={rc.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {rc.video_url.split('/').pop()}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClass(rc)} className="mr-2">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClass(rc)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                    No recorded classes found. Add a new class to get started!
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

export default ManageRecordedClassesPage;