"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Award, Loader2, User as UserIcon, ClipboardCheck, FileText, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <span className="text-lg text-slate-700">Loading results...</span>
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
            <CardTitle className="text-3xl font-bold">Test Results</CardTitle>
            <CardDescription className="text-blue-100 mt-2">
              आपकी क्लास की जानकारी नहीं मिली।
            </CardDescription>
          </div>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold text-slate-700 mb-6">परिणाम देखने के लिए, कृपया अपनी प्रोफ़ाइल में अपनी क्लास अपडेट करें।</p>
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
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <Award className="h-16 w-16 bg-white/20 p-3 rounded-full" />
          </div>
          <CardTitle className="text-3xl font-bold text-center">My Test Results</CardTitle>
          <CardDescription className="text-blue-100 text-center mt-2">
            यहां आपके ऑब्जेक्टिव टेस्ट के परिणाम और सब्जेक्टिव टेस्ट के ग्रेड देखें।
          </CardDescription>
        </div>
        <CardContent className="p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger 
                value="objective" 
                className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <ClipboardCheck className="h-4 w-4 mr-2" /> Objective Tests
              </TabsTrigger>
              <TabsTrigger 
                value="subjective" 
                className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <FileText className="h-4 w-4 mr-2" /> Subjective Tests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="objective" className="mt-0">
              {objectiveResults.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-700">Test Title</TableHead>
                        <TableHead className="font-semibold text-slate-700">Subject</TableHead>
                        <TableHead className="font-semibold text-slate-700">Score</TableHead>
                        <TableHead className="font-semibold text-slate-700">Submitted On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {objectiveResults.map((result, index) => (
                        <TableRow key={result.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                          <TableCell className="font-medium text-slate-800">{result.objective_tests?.title || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                              {result.objective_tests?.subject || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-[100px]">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${(result.score / result.total_questions) * 100}%` }}
                                ></div>
                              </div>
                              <span className="font-semibold text-slate-800">
                                {result.score} / {result.total_questions}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-1 text-slate-400" />
                              {format(new Date(result.submitted_at), "PPP")}
                            </div>
                            <div className="flex items-center text-sm">
                              <Clock className="h-4 w-4 mr-1 text-slate-400" />
                              {format(new Date(result.submitted_at), "HH:mm")}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                  <ClipboardCheck className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg text-slate-600">
                    आपने अभी तक कोई ऑब्जेक्टिव टेस्ट सबमिट नहीं किया है।
                  </p>
                  <Button 
                    onClick={() => navigate("/objective-test")} 
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Take Objective Test
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="subjective" className="mt-0">
              {subjectiveResults.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-700">Test Title</TableHead>
                        <TableHead className="font-semibold text-slate-700">Question</TableHead>
                        <TableHead className="font-semibold text-slate-700">Subject</TableHead>
                        <TableHead className="font-semibold text-slate-700">Grade</TableHead>
                        <TableHead className="font-semibold text-slate-700">Graded On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectiveResults.map((result, index) => (
                        <TableRow key={result.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                          <TableCell className="font-medium text-slate-800">{result.student_subjective_submissions?.subjective_tests?.title || "N/A"}</TableCell>
                          <TableCell className="max-w-xs truncate text-slate-600">
                            {result.student_subjective_submissions?.subjective_questions?.question_text || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                              {result.student_subjective_submissions?.subjective_tests?.subject || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {result.grade !== null && result.grade !== undefined ? (
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {result.grade}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {result.graded_at ? (
                              <>
                                <div className="flex items-center text-sm">
                                  <Calendar className="h-4 w-4 mr-1 text-slate-400" />
                                  {format(new Date(result.graded_at), "PPP")}
                                </div>
                                <div className="flex items-center text-sm">
                                  <Clock className="h-4 w-4 mr-1 text-slate-400" />
                                  {format(new Date(result.graded_at), "HH:mm")}
                                </div>
                              </>
                            ) : (
                              <span className="text-slate-400">Not graded yet</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                  <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg text-slate-600">
                    आपने अभी तक कोई सब्जेक्टिव टेस्ट सबमिट नहीं किया है या कोई ग्रेड उपलब्ध नहीं है।
                  </p>
                  <Button 
                    onClick={() => navigate("/subjective-test")} 
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Take Subjective Test
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

export default ResultsPage;