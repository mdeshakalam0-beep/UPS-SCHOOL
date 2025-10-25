"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MessageSquare, Loader2, User as UserIcon, UploadCloud, CheckCircle, XCircle, FileText, Calendar, Clock } from "lucide-react";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/components/SessionContextProvider";
import { showError, showSuccess } from "@/utils/toast";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const classes = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];
const subjects = [
  "Anthropology", "Biology", "Chemistry", "Civic Political Science", "Computer Science",
  "Disaster Management", "Economics", "English", "General", "Geography", "Hindi",
  "History", "Mathematics", "Physics", "Psychology", "Sanskrit", "Science", "Urdu"
];

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
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
}

const StudentDobitPage = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [userClass, setUserClass] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("submit"); // 'submit' or 'my-doubts'

  // Submission form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // My Doubts states
  const [myDoubts, setMyDoubts] = useState<StudentDoubt[]>([]);
  const [loadingMyDoubts, setLoadingMyDoubts] = useState(true);
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

  const fetchMyDoubts = useCallback(async () => {
    if (user) {
      setLoadingMyDoubts(true);
      const { data, error } = await supabase
        .from("student_doubts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching my doubts:", error);
        showError("Failed to load your doubts.");
      } else {
        setMyDoubts(data as StudentDoubt[]);
      }
      setLoadingMyDoubts(false);
    }
  }, [user]);

  useEffect(() => {
    if (!sessionLoading) {
      fetchUserClass();
      fetchMyDoubts();
    }
  }, [sessionLoading, fetchUserClass, fetchMyDoubts]);

  // Realtime subscription for doubt updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`student_doubts_for_user_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_doubts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedDoubt = payload.new as StudentDoubt;
          if (updatedDoubt.status === 'resolved') {
            showSuccess(`Your doubt "${updatedDoubt.title}" has been resolved!`);
          }
          fetchMyDoubts(); // Refresh the list of doubts
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMyDoubts]);

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
      fetchMyDoubts(); // Refresh doubts after submission
      setActiveTab("my-doubts"); // Switch to my doubts tab
    } catch (error: any) {
      console.error("Error submitting doubt:", error.message);
      showError(`Failed to submit doubt: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionLoading || loadingUserClass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <span className="text-lg text-slate-700">Loading...</span>
        </div>
      </div>
    );
  }

  if (!userClass) {
    return (
      <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-4xl mb-6">
          <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2 bg-white shadow-md hover:shadow-lg transition-shadow">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
        <Card className="w-full max-w-4xl shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white text-center">
            <UserIcon className="h-16 w-16 mx-auto mb-4 bg-white/20 p-3 rounded-full" />
            <CardTitle className="text-3xl font-bold">Dobit Box</CardTitle>
            <CardDescription className="text-blue-100 mt-2">
              आपकी क्लास की जानकारी नहीं मिली।
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold text-slate-700 mb-6">संदेह प्रस्तुत करने के लिए, कृपया अपनी प्रोफ़ाइल में अपनी क्लास अपडेट करें।</p>
            <Button onClick={() => navigate("/profile")} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              प्रोफ़ाइल अपडेट करें
            </Button>
          </CardContent>
        </Card>
        <BottomNavigationBar />
      </div>
    );
  }

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
              <MessageSquare className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center">Dobit Box</CardTitle>
          <CardDescription className="text-blue-100 text-center mt-2">
            अपनी क्लास ({userClass}) के लिए संदेह प्रस्तुत करें या अपने मौजूदा संदेह देखें।
          </CardDescription>
        </div>
        
        <CardContent className="p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger 
                value="submit" 
                className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <UploadCloud className="h-4 w-4 mr-2" /> Submit New Doubt
              </TabsTrigger>
              <TabsTrigger 
                value="my-doubts" 
                className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <FileText className="h-4 w-4 mr-2" /> My Doubts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="submit" className="mt-0">
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-slate-800">Submit a New Doubt</CardTitle>
                  <CardDescription className="text-slate-600">
                    Fill in the details below to submit your doubt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitDoubt} className="space-y-6">
                    <div>
                      <Label htmlFor="title" className="text-slate-700 font-medium">Doubt Title</Label>
                      <Input
                        id="title"
                        type="text"
                        placeholder="e.g., Question about Photosynthesis"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 border-slate-300 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-slate-700 font-medium">Detailed Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Explain your doubt in detail..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={6}
                        className="mt-1 border-slate-300 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject" className="text-slate-700 font-medium">Subject</Label>
                      <Select onValueChange={setSelectedSubject} value={selectedSubject} required>
                        <SelectTrigger className="w-full mt-1 border-slate-300 focus:border-blue-500">
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
                      <Label htmlFor="attachment" className="text-slate-700 font-medium">Attachment (Optional)</Label>
                      <div className="mt-1 flex items-center space-x-2">
                        <Input
                          id="attachment"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleAttachmentChange}
                          className="border-slate-300 focus:border-blue-500"
                        />
                        {attachmentFile && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {attachmentFile.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                      Submit Doubt
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="my-doubts" className="mt-0">
              {loadingMyDoubts ? (
                <div className="flex justify-center items-center h-40 bg-white rounded-xl shadow-sm border border-slate-200">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-slate-600">Loading your doubts...</span>
                </div>
              ) : myDoubts.length > 0 ? (
                <div className="space-y-4">
                  {myDoubts.map((doubt) => (
                    <Card key={doubt.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border-0">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-xl font-semibold text-slate-800">{doubt.title}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                                {doubt.subject}
                              </Badge>
                              <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                                {doubt.class}
                              </Badge>
                            </div>
                            <div className="flex items-center text-xs text-slate-500 mt-2">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{format(new Date(doubt.created_at), "PPP")}</span>
                              <Clock className="h-3 w-3 ml-2 mr-1" />
                              <span>{format(new Date(doubt.created_at), "HH:mm")}</span>
                            </div>
                          </div>
                          <div>
                            {doubt.status === 'resolved' ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" /> Resolved
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200">
                                <XCircle className="h-3 w-3 mr-1" /> Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white">
                        <p className="text-slate-700 text-sm mb-3 whitespace-pre-wrap">{doubt.description}</p>
                        {doubt.attachment_url && (
                          <div className="mb-3">
                            <p className="text-sm text-slate-600 mb-1">Attachment:</p>
                            <a 
                              href={doubt.attachment_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              {doubt.attachment_url.split('/').pop()}
                            </a>
                          </div>
                        )}
                        {doubt.status === 'resolved' && doubt.resolution_text && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="font-semibold text-green-800 mb-1 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" /> Resolution:
                            </h4>
                            <p className="text-sm text-green-700 whitespace-pre-wrap">{doubt.resolution_text}</p>
                            {doubt.resolved_at && (
                              <p className="text-xs text-green-600 mt-2 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Resolved on: {format(new Date(doubt.resolved_at), "PPP HH:mm")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                  <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">No Doubts Submitted</h3>
                  <p className="text-slate-600">आपने अभी तक कोई संदेह प्रस्तुत नहीं किया है।</p>
                  <Button 
                    onClick={() => setActiveTab("submit")} 
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Submit Your First Doubt
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default StudentDobitPage;