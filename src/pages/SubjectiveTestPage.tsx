"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/utils/toast";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/components/SessionContextProvider";
import { Loader2, User, ArrowLeft, FileText as FileTextIcon, CalendarDays, Clock, BookOpen, Filter, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { format, isPast } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface SubjectiveTest {
  id: string;
  title: string;
  description: string | null;
  class: string;
  subject: string;
  due_date: string;
}

interface SubjectiveQuestion {
  id: string;
  test_id: string;
  question_text: string;
}

interface StudentSubmission {
  id: string;
  user_id: string;
  test_id: string;
  question_id: string;
  answer_text: string | null;
  attachment_url: string | null;
  submitted_at: string;
  student_subjective_grades: { id: string; grade: number | null; feedback: string | null }[];
}

const subjects = [
  "Anthropology", "Biology", "Chemistry", "Civic Political Science", "Computer Science",
  "Disaster Management", "Economics", "English", "General", "Geography", "Hindi",
  "History", "Mathematics", "Physics", "Psychology", "Sanskrit", "Science", "Urdu"
];

const SubjectiveTestPage = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [availableTests, setAvailableTests] = useState<SubjectiveTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<SubjectiveTest | null>(null);
  const [questions, setQuestions] = useState<SubjectiveQuestion[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [attachments, setAttachments] = useState<{ [key: string]: File | null }>({});
  const [existingSubmissions, setExistingSubmissions] = useState<{ [questionId: string]: StudentSubmission }>({});

  const [testStarted, setTestStarted] = useState(false);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userClass, setUserClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const fetchUserClassAndTests = useCallback(async () => {
    setLoadingTests(true);
    if (!user) {
      setLoadingTests(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('class')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error fetching user profile:", profileError);
      showError("Failed to load user profile to filter tests.");
      setUserClass(null);
      setAvailableTests([]);
      setLoadingTests(false);
      return;
    }

    const currentUserClass = profile?.class;
    setUserClass(currentUserClass);

    if (!currentUserClass) {
      console.warn("User class not found. Cannot filter subjective tests.");
      setAvailableTests([]);
      setLoadingTests(false);
      return;
    }

    let query = supabase
      .from("subjective_tests")
      .select("*")
      .eq("class", currentUserClass);

    if (selectedSubject) {
      query = query.eq("subject", selectedSubject);
    }

    const { data, error } = await query.order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching subjective tests:", error);
      showError("Failed to load subjective tests.");
    } else {
      setAvailableTests(data as SubjectiveTest[]);
    }
    setLoadingTests(false);
  }, [user, selectedSubject]);

  useEffect(() => {
    if (!sessionLoading) {
      fetchUserClassAndTests();
    }
  }, [sessionLoading, fetchUserClassAndTests]);

  const fetchQuestionsAndSubmissionsForTest = useCallback(async (testId: string) => {
    setLoadingQuestions(true);
    const { data: questionsData, error: questionsError } = await supabase
      .from("subjective_questions")
      .select("*")
      .eq("test_id", testId)
      .order("created_at", { ascending: true });

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      showError("Failed to load questions for the test.");
      setQuestions([]);
      setLoadingQuestions(false);
      return;
    }
    setQuestions(questionsData as SubjectiveQuestion[]);

    if (user) {
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("student_subjective_submissions")
        .select(`
          *,
          student_subjective_grades!fk_submission_id (id, grade, feedback)
        `)
        .eq("test_id", testId)
        .eq("user_id", user.id);

      if (submissionsError) {
        console.error("Error fetching existing submissions:", submissionsError);
        showError("Failed to load your previous submissions.");
      } else {
        const submissionsMap: { [key: string]: StudentSubmission } = {};
        const initialAnswers: { [key: string]: string } = {};
        submissionsData.forEach((sub: StudentSubmission) => {
          submissionsMap[sub.question_id] = sub;
          if (sub.answer_text) {
            initialAnswers[sub.question_id] = sub.answer_text;
          }
        });
        setExistingSubmissions(submissionsMap);
        setAnswers(initialAnswers);
      }
    }

    setLoadingQuestions(false);
  }, [user]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleAttachmentChange = (questionId: string, file: File | null) => {
    setAttachments((prev) => ({ ...prev, [questionId]: file }));
  };

  const uploadAttachment = async (file: File, userId: string, questionId: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${questionId}-${Date.now()}.${fileExt}`;
    const filePath = `subjective_attachments/${fileName}`;

    const { data, error } = await supabase.storage.from("subjective_submissions_bucket").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from("subjective_submissions_bucket").getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const handleSubmitTest = async () => {
    setIsSubmitting(true);
    if (!user || !selectedTest) {
      showError("User or test not found for submitting answers.");
      setIsSubmitting(false);
      return;
    }

    try {
      for (const question of questions) {
        const answerText = answers[question.id] || null;
        const attachmentFile = attachments[question.id] || null;
        let attachmentUrl: string | null = existingSubmissions[question.id]?.attachment_url || null;

        if (attachmentFile) {
          attachmentUrl = await uploadAttachment(attachmentFile, user.id, question.id);
        }

        const existingSubmission = existingSubmissions[question.id];

        if (existingSubmission) {
          const { error } = await supabase
            .from("student_subjective_submissions")
            .update({
              answer_text: answerText,
              attachment_url: attachmentUrl,
              submitted_at: new Date().toISOString(),
            })
            .eq("id", existingSubmission.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from("student_subjective_submissions").insert({
            user_id: user.id,
            test_id: selectedTest.id,
            question_id: question.id,
            answer_text: answerText,
            attachment_url: attachmentUrl,
          });

          if (error) throw error;
        }
      }

      showSuccess("Subjective test submitted successfully! Results will be available after admin review.");
      setIsSubmitting(false);
      navigate("/student-dashboard");
    } catch (error: any) {
      console.error("Error submitting test:", error.message);
      showError(`Failed to submit test: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  const startTest = async (test: SubjectiveTest) => {
    setSelectedTest(test);
    setLoadingQuestions(true);
    await fetchQuestionsAndSubmissionsForTest(test.id);
    setLoadingQuestions(false);

    if (questions.length === 0) {
      showError("This test has no questions yet. Please try another test.");
      return;
    }

    setTestStarted(true);
    showSuccess(`Subjective Test "${test.title}" Started!`);
  };

  if (sessionLoading || loadingTests) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <span className="text-lg text-slate-700">Loading tests...</span>
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
            <User className="h-16 w-16 mx-auto mb-4 bg-white/20 p-3 rounded-full" />
            <CardTitle className="text-3xl font-bold">Subjective Tests</CardTitle>
            <CardDescription className="text-blue-100 mt-2">
              आपकी क्लास की जानकारी नहीं मिली।
            </CardDescription>
          </div>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold text-slate-700 mb-6">सब्जेक्टिव टेस्ट देखने के लिए, कृपया अपनी प्रोफ़ाइल में अपनी क्लास अपडेट करें।</p>
            <Button onClick={() => navigate("/profile")} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              प्रोफ़ाइल अपडेट करें
            </Button>
          </CardContent>
        </Card>
        <BottomNavigationBar />
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center p-4 pb-20 md:pb-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-5xl mb-6">
          <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2 bg-white shadow-md hover:shadow-lg transition-shadow">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
        <Card className="w-full max-w-5xl shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-white/20 p-4 rounded-full">
                <FileTextIcon className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-center">Subjective Tests</CardTitle>
            <CardDescription className="text-blue-100 text-center mt-2">
              अपनी क्लास ({userClass}) के लिए उपलब्ध टेस्ट चुनें।
            </CardDescription>
          </div>
          <CardContent className="p-8">
            <div className="mb-6 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-md p-2 flex items-center space-x-2 w-full md:w-1/2 lg:w-1/3">
                <Filter className="h-5 w-5 text-blue-600 ml-2" />
                <Select onValueChange={(value) => setSelectedSubject(value === "all" ? null : value)} value={selectedSubject || "all"}>
                  <SelectTrigger className="border-0 focus:ring-0">
                    <SelectValue placeholder="Filter by Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {availableTests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableTests.map((test) => {
                  const dueDate = new Date(test.due_date);
                  const isOverdue = isPast(dueDate);
                  return (
                    <Card key={test.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">{test.title}</h3>
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{test.description}</p>
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                            {test.class}
                          </Badge>
                          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                            {test.subject}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-slate-500">
                          <CalendarDays className="h-3 w-3 mr-1" />
                          <span>Due: {format(dueDate, "PPP")}</span>
                          <Clock className="h-3 w-3 ml-2 mr-1" />
                          <span>{format(dueDate, "HH:mm")}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-white">
                        <Button 
                          onClick={() => startTest(test)} 
                          className={`w-full font-medium py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ${
                            isOverdue 
                              ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                          disabled={loadingQuestions || isOverdue}
                        >
                          {loadingQuestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
                          {isOverdue ? "Test Overdue" : "Start Test"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                <FileTextIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Tests Available</h3>
                <p className="text-slate-600">
                  {selectedSubject ? `No subjective tests found for ${selectedSubject} in your class.` : "अभी आपकी क्लास के लिए कोई सब्जेक्टिव टेस्ट उपलब्ध नहीं है।"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <BottomNavigationBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-5xl mb-6">
        <Button variant="outline" onClick={() => navigate("/subjective-test")} className="flex items-center space-x-2 bg-white shadow-md hover:shadow-lg transition-shadow">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tests</span>
        </Button>
      </div>
      <Card className="w-full max-w-5xl shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-white/20 p-4 rounded-full">
              <FileTextIcon className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center">{selectedTest?.title}</CardTitle>
          <CardDescription className="text-blue-100 text-center mt-2">
            {selectedTest?.description || "Provide detailed answers to the questions below. You can also attach relevant files."}
            <br />
            <div className="flex items-center justify-center mt-2">
              <CalendarDays className="h-4 w-4 mr-1" />
              <span>Due: {selectedTest?.due_date ? format(new Date(selectedTest.due_date), "PPP HH:mm") : "N/A"}</span>
            </div>
          </CardDescription>
        </div>
        <CardContent className="p-8">
          {questions.map((q, index) => {
            const submission = existingSubmissions[q.id];
            const isGraded = submission?.student_subjective_grades?.[0]?.grade !== null && submission?.student_subjective_grades?.[0]?.grade !== undefined;
            return (
              <div key={q.id} className="mb-8 last:mb-0">
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Question {index + 1}
                  </h3>
                  <p className="text-slate-700">{q.question_text}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`answer-${q.id}`} className="text-slate-700 font-medium mb-2 block">
                      Your Answer:
                    </Label>
                    <Textarea
                      id={`answer-${q.id}`}
                      placeholder="Type your answer here..."
                      value={answers[q.id] || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      rows={6}
                      className="w-full border-slate-300 focus:border-blue-500"
                      disabled={isGraded}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`attachment-${q.id}`} className="text-slate-700 font-medium mb-2 block">
                      Optional Attachment (Image/PDF):
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id={`attachment-${q.id}`}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleAttachmentChange(q.id, e.target.files ? e.target.files[0] : null)}
                        className="flex-1 border-slate-300 focus:border-blue-500"
                        disabled={isGraded}
                      />
                      <Upload className="h-5 w-5 text-slate-400" />
                    </div>
                    {submission?.attachment_url && !attachments[q.id] && (
                      <p className="text-sm text-slate-600 mt-2">
                        Current: <a href={submission.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{submission.attachment_url.split('/').pop()}</a>
                      </p>
                    )}
                    {attachments[q.id] && (
                      <p className="text-sm text-slate-600 mt-2">
                        New file selected: {attachments[q.id]?.name}
                      </p>
                    )}
                  </div>
                  {isGraded && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <h4 className="font-semibold text-green-800">Your Grade: {submission.student_subjective_grades[0].grade}</h4>
                      </div>
                      {submission.student_subjective_grades[0].feedback && (
                        <p className="text-sm text-green-700">Feedback: {submission.student_subjective_grades[0].feedback}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
        <CardFooter className="bg-slate-50 p-6">
          <Button
            onClick={handleSubmitTest}
            disabled={isSubmitting || isPast(new Date(selectedTest?.due_date || ""))}
            className={`ml-auto font-medium py-2 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ${
              isPast(new Date(selectedTest?.due_date || "")) 
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : isPast(new Date(selectedTest?.due_date || "")) ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Test Overdue
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Submit Test
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default SubjectiveTestPage;