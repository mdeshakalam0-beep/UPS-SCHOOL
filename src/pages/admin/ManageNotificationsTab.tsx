"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BellRing, PlusCircle, Loader2, Trash2, Pencil, Volume2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/components/SessionContextProvider";
import { showError, showSuccess } from "@/utils/toast";
import { format } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  sound_url: string | null;
  class_target: string | null;
  created_by: string | null;
  created_at: string;
}

interface SoundFile {
  name: string;
  url: string;
}

const classes = ["All Classes", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

const ManageNotificationsTab = () => {
  const { user } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [newNotificationData, setNewNotificationData] = useState<{
    title: string;
    message: string;
    soundFile: File | null;
    selectedSoundUrl: string | null;
    class_target: string;
  }>({
    title: "",
    message: "",
    soundFile: null,
    selectedSoundUrl: null,
    class_target: "All Classes",
  });
  const [availableSounds, setAvailableSounds] = useState<SoundFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      showError("Failed to load notifications.");
    } else {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  }, []);

  const fetchAvailableSounds = useCallback(async () => {
    const { data, error } = await supabase.storage.from('notification_sounds_bucket').list('public', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      console.error("Error fetching sound files:", error);
      showError("Failed to load available sounds.");
      setAvailableSounds([]);
    } else {
      const soundFiles = data.map(file => {
        const { data: publicUrlData } = supabase.storage.from('notification_sounds_bucket').getPublicUrl(`public/${file.name}`);
        return { name: file.name, url: publicUrlData.publicUrl };
      });
      setAvailableSounds(soundFiles);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchAvailableSounds();
  }, [fetchNotifications, fetchAvailableSounds]);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
  }, []);

  const playSoundPreview = useCallback((soundUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = soundUrl;
      audioRef.current.play().catch(e => console.error("Error playing sound preview:", e));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, files } = e.target;
    if (id === "soundFile" && files && files.length > 0) {
      setNewNotificationData((prev) => ({ ...prev, soundFile: files[0], selectedSoundUrl: null })); // Clear selected URL if new file uploaded
    } else {
      setNewNotificationData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSelectChange = (id: string, value: string) => {
    if (id === "class_target") {
      setNewNotificationData((prev) => ({ ...prev, class_target: value }));
    } else if (id === "selectedSoundUrl") {
      setNewNotificationData((prev) => ({ ...prev, selectedSoundUrl: value, soundFile: null })); // Clear sound file if URL selected
      if (value) {
        playSoundPreview(value);
      }
    }
  };

  const uploadSoundFile = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { data, error } = await supabase.storage.from("notification_sounds_bucket").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from("notification_sounds_bucket").getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const handleSendNotification = async () => {
    setIsSubmitting(true);
    if (!newNotificationData.title || !newNotificationData.message) {
      showError("Please fill in the notification title and message.");
      setIsSubmitting(false);
      return;
    }
    if (!user) {
      showError("You must be logged in to send a notification.");
      setIsSubmitting(false);
      return;
    }

    try {
      let finalSoundUrl: string | null = newNotificationData.selectedSoundUrl;

      if (newNotificationData.soundFile) {
        finalSoundUrl = await uploadSoundFile(newNotificationData.soundFile);
        await fetchAvailableSounds(); // Refresh sound list after upload
      }

      const { error } = await supabase.from("notifications").insert({
        title: newNotificationData.title,
        message: newNotificationData.message,
        sound_url: finalSoundUrl,
        class_target: newNotificationData.class_target === "All Classes" ? null : newNotificationData.class_target,
        created_by: user.id,
      });

      if (error) {
        throw error;
      }

      showSuccess("Notification sent successfully!");
      fetchNotifications();
      handleDialogClose();
    } catch (error: any) {
      console.error("Error sending notification:", error.message);
      showError(`Failed to send notification: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditNotification = (notification: Notification) => {
    setEditingNotification(notification);
    setNewNotificationData({
      title: notification.title,
      message: notification.message,
      soundFile: null,
      selectedSoundUrl: notification.sound_url,
      class_target: notification.class_target || "All Classes",
    });
    setIsDialogOpen(true);
  };

  const handleUpdateNotification = async () => {
    setIsSubmitting(true);
    if (!editingNotification || !newNotificationData.title || !newNotificationData.message) {
      showError("Please fill in the notification title and message.");
      setIsSubmitting(false);
      return;
    }

    try {
      let finalSoundUrl: string | null = newNotificationData.selectedSoundUrl;

      if (newNotificationData.soundFile) {
        // If a new file is selected, upload it
        finalSoundUrl = await uploadSoundFile(newNotificationData.soundFile);
        await fetchAvailableSounds(); // Refresh sound list after upload
        // Optionally, delete the old sound file from storage if it's no longer needed
        // This would require tracking the old sound_url and deleting it.
      }

      const { error } = await supabase
        .from("notifications")
        .update({
          title: newNotificationData.title,
          message: newNotificationData.message,
          sound_url: finalSoundUrl,
          class_target: newNotificationData.class_target === "All Classes" ? null : newNotificationData.class_target,
          // created_by and created_at should not be updated here
        })
        .eq("id", editingNotification.id);

      if (error) {
        throw error;
      }

      showSuccess("Notification updated successfully!");
      fetchNotifications();
      handleDialogClose();
    } catch (error: any) {
      console.error("Error updating notification:", error.message);
      showError(`Failed to update notification: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNotification = async (notification: Notification) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      // Optionally, delete the associated sound file from storage if it's unique to this notification
      // This would require more complex logic to check if other notifications use the same sound_url
      // For simplicity, we'll only delete the database record for now.

      const { error: dbError } = await supabase.from("notifications").delete().eq("id", notification.id);

      if (dbError) {
        throw dbError;
      }

      showSuccess("Notification deleted successfully!");
      fetchNotifications();
    } catch (error: any) {
      console.error("Error deleting notification:", error.message);
      showError(`Failed to delete notification: ${error.message}`);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingNotification(null);
    setNewNotificationData({
      title: "",
      message: "",
      soundFile: null,
      selectedSoundUrl: null,
      class_target: "All Classes",
    });
  };

  return (
    <Card className="w-full shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-primary">Manage Notifications</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingNotification(null); handleDialogClose(); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Send New Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingNotification ? "Edit Notification" : "Send New Notification"}</DialogTitle>
              <CardDescription>{editingNotification ? "Update notification details." : "Compose and send a new real-time notification."}</CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input id="title" value={newNotificationData.title} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message" className="text-right">
                  Message
                </Label>
                <Textarea id="message" value={newNotificationData.message} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class_target" className="text-right">
                  Target Class
                </Label>
                <Select onValueChange={(value) => handleSelectChange("class_target", value)} value={newNotificationData.class_target} required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select target class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="selectedSoundUrl" className="text-right">
                  Select Sound
                </Label>
                <Select onValueChange={(value) => handleSelectChange("selectedSoundUrl", value)} value={newNotificationData.selectedSoundUrl || ""} >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a sound (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Sound</SelectItem>
                    {availableSounds.map((sound) => (
                      <SelectItem key={sound.name} value={sound.url}>
                        {sound.name.replace(/\.[^/.]+$/, "")} {/* Remove file extension */}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="soundFile" className="text-right">
                  Upload New Sound
                </Label>
                <Input id="soundFile" type="file" accept="audio/*" onChange={handleInputChange} className="col-span-3" />
                {newNotificationData.soundFile && (
                  <div className="col-span-4 text-sm text-muted-foreground text-right">
                    Selected: {newNotificationData.soundFile.name}
                  </div>
                )}
                {newNotificationData.selectedSoundUrl && !newNotificationData.soundFile && (
                  <div className="col-span-4 text-sm text-muted-foreground text-right">
                    Current: <a href={newNotificationData.selectedSoundUrl} target="_blank" rel="noopener noreferrer" className="underline">{newNotificationData.selectedSoundUrl.split('/').pop()}</a>
                    <Button variant="ghost" size="icon" onClick={() => playSoundPreview(newNotificationData.selectedSoundUrl || '')} className="ml-2">
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={editingNotification ? handleUpdateNotification : handleSendNotification} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingNotification ? "Save Changes" : "Send Notification"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading notifications...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Target Class</TableHead>
                <TableHead>Sound</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium">{notification.title}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{notification.message}</TableCell>
                    <TableCell>{notification.class_target || "All Classes"}</TableCell>
                    <TableCell>
                      {notification.sound_url ? (
                        <div className="flex items-center">
                          <a href={notification.sound_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[100px]">
                            {notification.sound_url.split('/').pop()}
                          </a>
                          <Button variant="ghost" size="icon" onClick={() => playSoundPreview(notification.sound_url || '')} className="ml-1 h-6 w-6">
                            <Volume2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : "No Sound"}
                    </TableCell>
                    <TableCell>{format(new Date(notification.created_at), "PPP HH:mm")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditNotification(notification)} className="mr-2">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteNotification(notification)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                    No notifications sent yet.
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

export default ManageNotificationsTab;