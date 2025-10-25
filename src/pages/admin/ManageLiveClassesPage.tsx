"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { Video, Pencil, Trash2, PlusCircle, Loader2, CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/components/SessionContextProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch"; // Import Switch component
import { Badge } from "@/components/ui/badge"; // Import Badge component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select

interface LiveClass {
  id: string;
  title: string;
  description: string | null;
  meeting_link: string;
  class: string;
  scheduled_at: string; // ISO string
  duration_minutes: number | null;
  uploaded_by: string | null;
  created_at: string;
  is_active: boolean;
  platform: string; // Added platform
}

const ManageLiveClassesPage = () => {
  const { user } = useSession();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<LiveClass | null>(null);
  const [newClassData, setNewClassData] = useState<{
    title: string;
    description: string;
    meeting_link: string;
    class: string;
    scheduled_at: Date | undefined;
    duration_minutes: number | undefined;
    is_active: boolean;
    platform: string; // Added platform
  }>({
    title: "",
    description: "",
    meeting_link: "",
    class: "",
    scheduled_at: undefined,
    duration_minutes: undefined,
    is_active: true,
    platform: "Other", // Default platform
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLiveClasses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("live_classes")
      .select("*")
      .order("scheduled_at", { ascending: false });

    if (error) {
      console.error("Error fetching live classes:", error);
      showError("Failed to load live classes.");
    } else {
      setLiveClasses(data as LiveClass[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLiveClasses();
  }, [fetchLiveClasses]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewClassData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setNewClassData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setNewClassData((prev) => ({ ...prev, is_active: checked }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setNewClassData((prev) => ({ ...prev, scheduled_at: date }));
  };

  const handleAddClass = async () => {
    setIsSubmitting(true);
    if (!newClassData.title || !newClassData.meeting_link || !newClassData.class || !newClassData.scheduled_at) {
      showError("Please fill in all required fields (Title, Meeting Link, Class, Scheduled At).");
      setIsSubmitting(false);
      return;
    }
    if (!user) {
      showError("You must be logged in to add a live class.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from("live_classes").insert({
        title: newClassData.title,
        description: newClassData.description,
        meeting_link: newClassData.meeting_link,
        class: newClassData.class,
        scheduled_at: newClassData.scheduled_at.toISOString(),
        duration_minutes: newClassData.duration_minutes,
        uploaded_by: user.id,
        is_active: newClassData.is_active,
        platform: newClassData.platform, // Include platform
      });

      if (error) {
        throw error;
      }

      showSuccess("Live class added successfully!");
      fetchLiveClasses();
      handleDialogClose();
    } catch (error: any) {
      console.error("Error adding live class:", error.message);
      showError(`Failed to add live class: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClass = (liveClass: LiveClass) => {
    setEditingClass(liveClass);
    setNewClassData({
      title: liveClass.title,
      description: liveClass.description || "",
      meeting_link: liveClass.meeting_link,
      class: liveClass.class,
      scheduled_at: new Date(liveClass.scheduled_at),
      duration_minutes: liveClass.duration_minutes || undefined,
      is_active: liveClass.is_active,
      platform: liveClass.platform, // Set platform for editing
    });
    setIsDialogOpen(true);
  };

  const handleUpdateClass = async () => {
    setIsSubmitting(true);
    if (!editingClass || !newClassData.title || !newClassData.meeting_link || !newClassData.class || !newClassData.scheduled_at) {
      showError("Please fill in all required fields (Title, Meeting Link, Class, Scheduled At).");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("live_classes")
        .update({
          title: newClassData.title,
          description: newClassData.description,
          meeting_link: newClassData.meeting_link,
          class: newClassData.class,
          scheduled_at: newClassData.scheduled_at.toISOString(),
          duration_minutes: newClassData.duration_minutes,
          updated_at: new Date().toISOString(),
          is_active: newClassData.is_active,
          platform: newClassData.platform, // Update platform
        })
        .eq("id", editingClass.id);

      if (error) {
        throw error;
      }

      showSuccess("Live class updated successfully!");
      fetchLiveClasses();
      handleDialogClose();
    } catch (error: any) {
      console.error("Error updating live class:", error.message);
      showError(`Failed to update live class: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this live class?")) {
      return;
    }

    try {
      const { error } = await supabase.from("live_classes").delete().eq("id", id);

      if (error) {
        throw error;
      }

      showSuccess("Live class deleted successfully!");
      fetchLiveClasses();
    } catch (error: any) {
      console.error("Error deleting live class:", error.message);
      showError(`Failed to delete live class: ${error.message}`);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingClass(null);
    setNewClassData({
      title: "",
      description: "",
      meeting_link: "",
      class: "",
      scheduled_at: undefined,
      duration_minutes: undefined,
      is_active: true,
      platform: "Other", // Reset to default
    });
  };

  return (
    <Card className="w-full shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-primary">Manage Live Classes</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingClass(null); handleDialogClose(); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Live Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingClass ? "Edit Live Class" : "Add New Live Class"}</DialogTitle>
              <CardDescription>{editingClass ? "Update live class details." : "Enter new live class information."}</CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input id="title" value={newClassData.title} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea id="description" value={newClassData.description} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="platform" className="text-right">
                  Platform
                </Label>
                <Select onValueChange={(value) => handleSelectChange("platform", value)} value={newClassData.platform} required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="Zoom">Zoom</SelectItem>
                    <SelectItem value="Other">Other (Embeddable URL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="meeting_link" className="text-right">
                  Meeting Link/URL
                </Label>
                <Input id="meeting_link" value={newClassData.meeting_link} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class" className="text-right">
                  Class
                </Label>
                <Input id="class" value={newClassData.class} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="scheduled_at" className="text-right">
                  Scheduled At
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal col-span-3",
                        !newClassData.scheduled_at && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newClassData.scheduled_at ? format(newClassData.scheduled_at, "PPP HH:mm") : <span>Pick date and time</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newClassData.scheduled_at}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                    <div className="p-3 border-t border-border">
                      <Input
                        type="time"
                        value={newClassData.scheduled_at ? format(newClassData.scheduled_at, "HH:mm") : ""}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':').map(Number);
                          if (newClassData.scheduled_at) {
                            const newDate = new Date(newClassData.scheduled_at);
                            newDate.setHours(hours, minutes);
                            setNewClassData((prev) => ({ ...prev, scheduled_at: newDate }));
                          } else {
                            const now = new Date();
                            now.setHours(hours, minutes);
                            setNewClassData((prev) => ({ ...prev, scheduled_at: now }));
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration_minutes" className="text-right">
                  Duration (min)
                </Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  value={newClassData.duration_minutes || ""}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_active" className="text-right">
                  Active
                </Label>
                <Switch
                  id="is_active"
                  checked={newClassData.is_active}
                  onCheckedChange={handleSwitchChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={editingClass ? handleUpdateClass : handleAddClass} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingClass ? "Save Changes" : "Add Live Class"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading live classes...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Platform</TableHead> {/* Added Platform column */}
                <TableHead>Scheduled At</TableHead>
                <TableHead>Duration (min)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liveClasses.length > 0 ? (
                liveClasses.map((lc) => (
                  <TableRow key={lc.id}>
                    <TableCell className="font-medium">{lc.title}</TableCell>
                    <TableCell>{lc.class}</TableCell>
                    <TableCell>{lc.platform}</TableCell> {/* Display Platform */}
                    <TableCell>{format(new Date(lc.scheduled_at), "PPP HH:mm")}</TableCell>
                    <TableCell>{lc.duration_minutes || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={lc.is_active ? "default" : "destructive"}>
                        {lc.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClass(lc)} className="mr-2">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClass(lc.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-4"> {/* Adjusted colspan */}
                    No live classes found. Add a new live class to get started!
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

export default ManageLiveClassesPage;