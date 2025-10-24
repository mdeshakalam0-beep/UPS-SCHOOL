"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MessageSquare, Loader2, User as UserIcon, UploadCloud } from "lucide-react";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/components/SessionContextProvider";
import { showError, showSuccess } from "@/utils/toast";

const classes = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];
const subjects = ["Mathematics", "Science", "English", "History", "Geography", "Physics", "Chemistry", "Biology", "Computer Science", "General"];

const DobitSubmissionPage = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [userClass, setUserClass] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingUserClass, setLoadingUserClass] = useState(true);

  const fetchUserClass = useCallback(async () => {
    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('class')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user profile:", error);
        showError("Failed to load user profile. Please update your profile.");
        setUserClass(null);
      } else if (profile) {
        setUserClass(profile.class);
      } else {
        setUserClass(null);
      }
    }
    setLoadingUserClass(false);
  }, [user]);

  useEffect(() => {
    if (!sessionLoading) {
      fetchUserClass();
    }
  }, [sessionLoading, fetchUserClass]);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAttachmentFile(file || null);
  };

  const uploadAttachment = async (file: File, userId: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `doubt_attachments/${fileName}`;

    const { data, error } = await supabase.storage.from("doubt_attachments_bucket").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from("doubt_attachments_bucket").getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const handleSubmitDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user) {
      showError("You must be logged in to submit a doubt.");
      setIsSubmitting(false);
      return;
    }

    if (!title || !description || !userClass || !selectedSubject) {
      showError("Please fill in all required fields (Title, Description, Class, Subject).");
      setIsSubmitting(false);
      return;
    }

    try {
      let attachmentUrl: string | null = null;
      if (attachmentFile) {
        attachmentUrl = await uploadAttachment(attachmentFile, user.id);
      }

      const { error } = await supabase.from("student_doubts").insert({
        user_id: user.id,
        title,
        description,
        class: userClass,
        subject: selectedSubject,
        attachment_url: attachmentUrl,
        status: "pending",
      });

      if (error) {
        throw error;
      }

      showSuccess("Doubt submitted successfully! An admin will review it soon.");
      setTitle("");
      setDescription("");
      setSelectedSubject("");
      setAttachmentFile(null);
      navigate("/student-dashboard");
    } catch (error: any) {
      console.error("Error submitting doubt:", error.message);
      showError(`Failed to submit doubt: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionLoading || loadingUserClass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!userClass) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-background p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="w-full max-w-4xl mb-6">
          <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
        <Card className="w-full max-w-4xl shadow-lg rounded-lg text-center p-8">
          <CardHeader>
            <UserIcon className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold text-primary">Dobit Box</CardTitle>
            <CardDescription className="text-muted-foreground">
              आपकी क्लास की जानकारी नहीं मिली।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-yellow-800 mb-2">संदेह प्रस्तुत करने के लिए, कृपया अपनी प्रोफ़ाइल में अपनी क्लास अपडेट करें।</p>
            <Button onClick={() => navigate("/profile")} className="bg-yellow-600 hover:bg-yellow-700 text-white">
              प्रोफ़ाइल अपडेट करें
            </Button>
          </CardContent>
        </Card>
        <BottomNavigationBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="w-full max-w-4xl mb-6">
        <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>
      <Card className="w-full max-w-4xl shadow-lg rounded-lg p-8">
        <CardHeader className="text-center">
          <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">Submit Your Doubt</CardTitle>
          <CardDescription className="text-muted-foreground">
            अपनी क्लास ({userClass}) के लिए एक नया संदेह प्रस्तुत करें।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitDoubt} className="space-y-6">
            <div>
              <Label htmlFor="title">Doubt Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Question about Photosynthesis"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                placeholder="Explain your doubt in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select onValueChange={setSelectedSubject} value={selectedSubject} required>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="attachment">Attachment (Optional)</Label>
              <Input
                id="attachment"
                type="file"
                accept="image/*,.pdf"
                onChange={handleAttachmentChange}
                className="mt-1"
              />
              {attachmentFile && (
                <p className="text-sm text-muted-foreground mt-1">Selected: {attachmentFile.name}</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              Submit Doubt
            </Button>
          </form>
        </CardContent>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default DobitSubmissionPage;