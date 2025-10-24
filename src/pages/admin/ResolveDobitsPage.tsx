"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, CheckCircle, XCircle, Loader2, Eye, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/components/SessionContextProvider";
import { showError, showSuccess } from "@/utils/toast";
import { format } from "date-fns";

interface StudentDoubt {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  class: string;
  subject: string;
  attachment_url: string | null;
  status: 'pending' | 'resolved';
  resolution_text: string | null;
  resolved_by: string | null; // ID of the admin who resolved it
  created_at: string;
  resolved_at: string | null;
  profiles: { first_name: string; last_name: string | null; email: string } | null; // Student's profile
  resolved_by_profile: { first_name: string; last_name: string | null } | null; // Admin's profile
}

const ResolveDobitsPage = () => {
  const { user } = useSession();
  const [doubts, setDoubts] = useState<StudentDoubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [selectedDoubt, setSelectedDoubt] = useState<StudentDoubt | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all"); // 'all', 'pending', 'resolved'

  const fetchDoubts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("student_doubts")
      .select(`
        *,
        profiles (first_name, last_name, email),
        resolved_by_profile:profiles!student_doubts_resolved_by_fkey (first_name, last_name)
      `)
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching doubts:", error);
      showError("Failed to load doubts.");
    } else {
      setDoubts(data as StudentDoubt[]);
    }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    fetchDoubts();
  }, [fetchDoubts]);

  const handleResolveDoubt = (doubt: StudentDoubt) => {
    setSelectedDoubt(doubt);
    setResolutionText(doubt.resolution_text || "");
    setIsResolveDialogOpen(true);
  };

  const handleSaveResolution = async () => {
    setIsSubmitting(true);
    if (!selectedDoubt || !user) {
      showError("No doubt selected or user not authenticated.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("student_doubts")
        .update({
          status: "resolved",
          resolution_text: resolutionText,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", selectedDoubt.id);

      if (error) {
        throw error;
      }

      showSuccess("Doubt resolved successfully!");
      fetchDoubts();
      handleDialogClose();
    } catch (error: any) {
      console.error("Error saving resolution:", error.message);
      showError(`Failed to save resolution: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    setIsResolveDialogOpen(false);
    setSelectedDoubt(null);
    setResolutionText("");
  };

  return (
    <Card className="w-full shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-primary">Resolve Dobits</CardTitle>
        <div className="flex items-center space-x-2">
          <Label htmlFor="filter-status" className="sr-only">Filter by Status</Label>
          <Select onValueChange={setFilterStatus} value={filterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doubts</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading doubts...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doubts.length > 0 ? (
                doubts.map((doubt) => (
                  <TableRow key={doubt.id}>
                    <TableCell className="font-medium">{doubt.title}</TableCell>
                    <TableCell>{doubt.profiles?.first_name} {doubt.profiles?.last_name}</TableCell>
                    <TableCell>{doubt.class}</TableCell>
                    <TableCell>{doubt.subject}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        doubt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {doubt.status.charAt(0).toUpperCase() + doubt.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleResolveDoubt(doubt)} className="mr-2">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                    No doubts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* Resolve Doubt Dialog */}
        <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Resolve Doubt: "{selectedDoubt?.title}"</DialogTitle>
              <CardDescription>Provide a resolution for this student's doubt.</CardDescription>
            </DialogHeader>
            {selectedDoubt && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Student:</Label>
                  <p>{selectedDoubt.profiles?.first_name} {selectedDoubt.profiles?.last_name} ({selectedDoubt.profiles?.email})</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Class / Subject:</Label>
                  <p>{selectedDoubt.class} / {selectedDoubt.subject}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Submitted On:</Label>
                  <p>{format(new Date(selectedDoubt.created_at), "PPP HH:mm")}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Doubt Description:</Label>
                  <Card className="p-3 bg-muted/50">
                    <p className="whitespace-pre-wrap">{selectedDoubt.description}</p>
                  </Card>
                </div>
                {selectedDoubt.attachment_url && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Attachment:</Label>
                    <p>
                      <a href={selectedDoubt.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Attachment ({selectedDoubt.attachment_url.split('/').pop()})
                      </a>
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="resolutionText" className="font-semibold">Resolution:</Label>
                  <Textarea
                    id="resolutionText"
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    rows={6}
                    placeholder="Type your resolution here..."
                    className="w-full"
                    disabled={selectedDoubt.status === 'resolved'}
                  />
                </div>
                {selectedDoubt.status === 'resolved' && (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Resolved by: {selectedDoubt.resolved_by_profile?.first_name} {selectedDoubt.resolved_by_profile?.last_name}</p>
                    <p>Resolved at: {selectedDoubt.resolved_at ? format(new Date(selectedDoubt.resolved_at), "PPP HH:mm") : "N/A"}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>Close</Button>
              {selectedDoubt?.status === 'pending' && (
                <Button onClick={handleSaveResolution} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  Mark as Resolved
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ResolveDobitsPage;