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
import { Loader2, User, ArrowLeft, FileText as FileTextIcon, CalendarDays } from "lucide-react";
import { format, isPast } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components

interface SubjectiveTest {
  id: string;
  title: string;
  description: string | null;
  class: string;
  subject: string; // Added subject
  due_date: string; // ISO string
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
  student_subjective_grades: { grade: number | null; feedback: string | null }[];
}

const subjects = ["Mathematics", "Science", "English", "History", "Geography", "Physics", "Chemistry", "Biology", "Computer Science", "General"]; // Defined subjects

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
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null); // New state for subject filter

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

    if (selectedSubject) { // Apply subject filter
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
  }, [user, selectedSubject]); // Added selectedSubject to dependencies

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
          student_subjective_grades (grade, feedback)
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
          // Log grade data for debugging
          if (sub.student_subjective_grades && sub.student_subjective_grades.length > 0) {
            console.log(`Submission ${sub.id} for question ${sub.question_id} has grade:`, sub.student_subjective_grades[0].grade);
          } else {
            console.log(`Submission ${sub.id} for question ${sub.question_id} has no grade yet.`);
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
          // Update existing submission
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
          // Insert new submission
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading tests...</span>
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
            <User className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold text-primary">Subjective Tests</CardTitle>
            <CardDescription className="text-muted-foreground">
              आपकी क्लास की जानकारी नहीं मिली।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-yellow-800 mb-2">सब्जेक्टिव टेस्ट देखने के लिए, कृपया अपनी प्रोफ़ाइल में अपनी क्लास अपडेट करें।</p>
            <Button onClick={() => navigate("/profile")} className="bg-yellow-600 hover:bg-yellow-700 text-white">
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
      <div className="min-h-screen flex flex-col items-center bg-background p-4 pb-20 md:pb-8">
        <div className="w-full max-w-4xl mb-6">
          <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
        <Card className="w-full max-w-4xl shadow-lg rounded-lg text-center p-8">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">Subjective Tests</CardTitle>
            <CardDescription className="text-muted-foreground">
              अपनी क्लास ({userClass}) के लिए उपलब्ध टेस्ट चुनें।
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-4">
              <Label htmlFor="subject-filter" className="sr-only">Filter by Subject</Label>
              <Select onValueChange={(value) => setSelectedSubject(value === "all" ? null : value)} value={selectedSubject || "all"}>
                <SelectTrigger className="w-full md:w-1/2 lg:w-1/3 mx-auto">
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
            {availableTests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTests.map((test) => {
                  const dueDate = new Date(test.due_date);
                  const isOverdue = isPast(dueDate);
                  return (
                    <Card key={test.id} className="p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{test.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{test.description}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <CalendarDays className="h-3 w-3 mr-1" />
                          <span>Due: {format(dueDate, "PPP HH:mm")}</span>
                        </div>
                        <p className="text-xs text-gray-500">Class: {test.class} | Subject: {test.subject}</p>
                      </div>
                      <div className="mt-4">
                        <Button onClick={() => startTest(test)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loadingQuestions || isOverdue}>
                          {loadingQuestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {isOverdue ? "Test Overdue" : "Start Test"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-lg text-muted-foreground">
                {selectedSubject ? `No subjective tests found for ${selectedSubject} in your class.` : "अभी आपकी क्लास के लिए कोई सब्जेक्टिव टेस्ट उपलब्ध नहीं है।"}
              </p>
            )}
          </CardContent>
        </Card>
        <BottomNavigationBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <Card className="w-full max-w-3xl shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">{selectedTest?.title}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {selectedTest?.description || "Provide detailed answers to the questions below. You can also attach relevant files."}
            <br />
            Due: {selectedTest?.due_date ? format(new Date(selectedTest.due_date), "PPP HH:mm") : "N/A"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {questions.map((q, index) => {
            const submission = existingSubmissions[q.id];
            const isGraded = submission?.student_subjective_grades?.[0]?.grade !== null && submission?.student_subjective_grades?.[0]?.grade !== undefined;
            return (
              <div key={q.id} className="border-b pb-6 last:border-b-0">
                <h3 className="text-lg font-semibold mb-3">
                  {index + 1}. {q.question_text}
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`answer-${q.id}`} className="mb-1 block">
                      Your Answer:
                    </Label>
                    <Textarea
                      id={`answer-${q.id}`}
                      placeholder="Type your answer here..."
                      value={answers[q.id] || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      rows={6}
                      className="w-full"
                      disabled={isGraded}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`attachment-${q.id}`} className="mb-1 block">
                      Optional Attachment (Image/PDF):
                    </Label>
                    <Input
                      id={`attachment-${q.id}`}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleAttachmentChange(q.id, e.target.files ? e.target.files[0] : null)}
                      className="w-full"
                      disabled={isGraded}
                    />
                    {submission?.attachment_url && !attachments[q.id] && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Current: <a href={submission.attachment_url} target="_blank" rel="noopener noreferrer" className="underline">{submission.attachment_url.split('/').pop()}</a>
                      </p>
                    )}
                    {attachments[q.id] && (
                      <p className="text-sm text-muted-foreground mt-1">
                        New file selected: {attachments[q.id]?.name}
                      </p>
                    )}
                  </div>
                  {isGraded && (
                    <Card className="mt-4 p-3 bg-green-50 border border-green-200">
                      <h4 className="font-semibold text-green-800">Your Grade: {submission.student_subjective_grades[0].grade}</h4>
                      {submission.student_subjective_grades[0].feedback && (
                        <p className="text-sm text-green-700">Feedback: {submission.student_subjective_grades[0].feedback}</p>
                      )}
                    </Card>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
        <CardFooter className="flex justify-end pt-6">
          <Button
            onClick={handleSubmitTest}
            disabled={isSubmitting || isPast(new Date(selectedTest?.due_date || ""))}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? "Submitting..." : isPast(new Date(selectedTest?.due_date || "")) ? "Test Overdue" : "Submit Test"}
          </Button>
        </CardFooter>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default SubjectiveTestPage;