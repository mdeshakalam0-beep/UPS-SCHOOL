"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Award, Loader2, User as UserIcon, ClipboardCheck, FileText } from "lucide-react";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import { useSession } from "@/components/SessionContextProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ObjectiveResult {
  id: string;
  user_id: string;
  test_id: string;
  score: number;
  total_questions: number;
  submitted_at: string;
  objective_tests: {
    title: string;
    subject: string;
    class: string;
    duration_minutes: number;
  } | null;
}

interface SubjectiveResult {
  id: string; // grade ID
  submission_id: string;
  grader_id: string | null;
  grade: number | null;
  feedback: string | null;
  graded_at: string | null;
  student_subjective_submissions: {
    id: string;
    user_id: string;
    test_id: string;
    question_id: string;
    submitted_at: string;
    subjective_tests: {
      title: string;
      subject: string;
      class: string;
      due_date: string;
    } | null;
    subjective_questions: {
      question_text: string;
    } | null;
  } | null;
}

const ResultsPage = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [objectiveResults, setObjectiveResults] = useState<ObjectiveResult[]>([]);
  const [subjectiveResults, setSubjectiveResults] = useState<SubjectiveResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [userClass, setUserClass] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("objective");

  const fetchUserClassAndResults = useCallback(async () => {
    setLoadingResults(true);
    if (!user) {
      setLoadingResults(false);
      return;
    }

    // Fetch user's class from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('class')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error fetching user profile:", profileError);
      showError("Failed to load user profile to filter results.");
      setUserClass(null);
      setLoadingResults(false);
      return;
    }

    const currentUserClass = profile?.class;
    setUserClass(currentUserClass);

    if (!currentUserClass) {
      console.warn("User class not found. Cannot filter results.");
      setObjectiveResults([]);
      setSubjectiveResults([]);
      setLoadingResults(false);
      return;
    }

    // Fetch Objective Test Results
    const { data: objData, error: objError } = await supabase
      .from("student_objective_results")
      .select(`
        *,
        objective_tests (title, subject, class, duration_minutes)
      `)
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false });

    if (objError) {
      console.error("Error fetching objective results:", objError);
      showError("Failed to load objective test results.");
    } else {
      setObjectiveResults(objData as ObjectiveResult[]);
    }

    // Fetch Subjective Test Grades
    const { data: subData, error: subError } = await supabase
      .from("student_subjective_grades")
      .select(`
        *,
        student_subjective_submissions!fk_submission_id (
          test_id,
          question_id,
          submitted_at,
          subjective_tests (title, subject, class, due_date),
          subjective_questions (question_text)
        )
      `)
      .order("graded_at", { ascending: false });

    if (subError) {
      console.error("Error fetching subjective grades:", subError);
      showError("Failed to load subjective test grades.");
    } else {
      setSubjectiveResults(subData as SubjectiveResult[]);
    }

    setLoadingResults(false);
  }, [user]);

  useEffect(() => {
    if (!sessionLoading) {
      fetchUserClassAndResults();
    }
  }, [sessionLoading, fetchUserClassAndResults]);

  if (sessionLoading || loadingResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading results...</span>
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
            <CardTitle className="text-3xl font-bold text-primary">Test Results</CardTitle>
            <CardDescription className="text-muted-foreground">
              आपकी क्लास की जानकारी नहीं मिली।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-yellow-800 mb-2">परिणाम देखने के लिए, कृपया अपनी प्रोफ़ाइल में अपनी क्लास अपडेट करें।</p>
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
          <Award className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">My Test Results</CardTitle>
          <CardDescription className="text-muted-foreground">
            यहां आपके ऑब्जेक्टिव टेस्ट के परिणाम और सब्जेक्टिव टेस्ट के ग्रेड देखें।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="objective" className="flex items-center justify-center">
                <ClipboardCheck className="h-4 w-4 mr-2" /> Objective Tests
              </TabsTrigger>
              <TabsTrigger value="subjective" className="flex items-center justify-center">
                <FileText className="h-4 w-4 mr-2" /> Subjective Tests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="objective" className="mt-0 space-y-4">
              {objectiveResults.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Submitted On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {objectiveResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.objective_tests?.title || "N/A"}</TableCell>
                        <TableCell>{result.objective_tests?.subject || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-base">
                            {result.score} / {result.total_questions}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(result.submitted_at), "PPP HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-lg text-muted-foreground py-4">
                  आपने अभी तक कोई ऑब्जेक्टिव टेस्ट सबमिट नहीं किया है।
                </p>
              )}
            </TabsContent>

            <TabsContent value="subjective" className="mt-0 space-y-4">
              {subjectiveResults.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Title</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Graded On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectiveResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.student_subjective_submissions?.subjective_tests?.title || "N/A"}</TableCell>
                        <TableCell>{result.student_subjective_submissions?.subjective_questions?.question_text || "N/A"}</TableCell>
                        <TableCell>{result.student_subjective_submissions?.subjective_tests?.subject || "N/A"}</TableCell>
                        <TableCell>
                          {result.grade !== null && result.grade !== undefined ? (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-base">
                              {result.grade}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-base">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{result.graded_at ? format(new Date(result.graded_at), "PPP HH:mm") : "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-lg text-muted-foreground py-4">
                  आपने अभी तक कोई सब्जेक्टिव टेस्ट सबमिट नहीं किया है या कोई ग्रेड उपलब्ध नहीं है।
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default ResultsPage;