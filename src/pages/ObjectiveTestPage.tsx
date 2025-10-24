"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { showSuccess, showError } from "@/utils/toast";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/components/SessionContextProvider";
import { Loader2, User, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components

interface ObjectiveTest {
  id: string;
  title: string;
  description: string | null;
  class: string;
  subject: string; // Added subject
  duration_minutes: number;
}

interface ObjectiveQuestion {
  id: string;
  test_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
}

const subjects = ["Mathematics", "Science", "English", "History", "Geography", "Physics", "Chemistry", "Biology", "Computer Science", "General"]; // Added subjects

const ObjectiveTestPage = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [availableTests, setAvailableTests] = useState<ObjectiveTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ObjectiveTest | null>(null);
  const [questions, setQuestions] = useState<ObjectiveQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // Initialized with 0, will be set by test duration
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [userClass, setUserClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null); // New state for subject filter
  const [answersSubmitted, setAnswersSubmitted] = useState<{ [key: string]: string }>({}); // Store all answers

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + (testFinished ? 1 : 0)) / totalQuestions) * 100 : 0;

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
      console.warn("User class not found. Cannot filter objective tests.");
      setAvailableTests([]);
      setLoadingTests(false);
      return;
    }

    let query = supabase
      .from("objective_tests")
      .select("*")
      .eq("class", currentUserClass);

    if (selectedSubject) {
      query = query.eq("subject", selectedSubject);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching objective tests:", error);
      showError("Failed to load objective tests.");
    } else {
      setAvailableTests(data as ObjectiveTest[]);
    }
    setLoadingTests(false);
  }, [user, selectedSubject]); // Added selectedSubject to dependencies

  useEffect(() => {
    if (!sessionLoading) {
      fetchUserClassAndTests();
    }
  }, [sessionLoading, fetchUserClassAndTests]);

  const fetchQuestionsForTest = useCallback(async (testId: string) => {
    setLoadingQuestions(true);
    const { data, error } = await supabase
      .from("objective_questions")
      .select("*")
      .eq("test_id", testId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching questions:", error);
      showError("Failed to load questions for the test.");
      setQuestions([]);
    } else {
      setQuestions(data as ObjectiveQuestion[]);
    }
    setLoadingQuestions(false);
  }, []);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setAnswersSubmitted((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const evaluateAnswer = useCallback(() => {
    if (selectedAnswer === currentQuestion.correct_option) {
      setScore((prevScore) => prevScore + 1);
    }
  }, [selectedAnswer, currentQuestion]);

  const submitTestResults = useCallback(async () => {
    if (!user || !selectedTest) {
      showError("User or test not found for submitting results.");
      return;
    }

    try {
      const { error } = await supabase.from("student_objective_results").insert({
        user_id: user.id,
        test_id: selectedTest.id,
        score: score,
        total_questions: totalQuestions,
      });

      if (error) {
        throw error;
      }
      console.log("Test results submitted successfully!");
    } catch (error: any) {
      console.error("Error submitting test results:", error.message);
      showError(`Failed to submit test results: ${error.message}`);
    }
  }, [user, selectedTest, score, totalQuestions]);

  const handleNextQuestion = useCallback(() => {
    evaluateAnswer();
    setSelectedAnswer(null); // Reset selected answer for next question

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      // setTimeLeft(selectedTest?.duration_minutes || 0); // Removed: Timer is for the whole test, not per question
    } else {
      setTestFinished(true);
      setShowResultDialog(true);
      showSuccess("Test completed! Calculating results...");
      submitTestResults();
    }
  }, [currentQuestionIndex, totalQuestions, evaluateAnswer, submitTestResults]); // Removed selectedTest from dependencies as it's not directly used here

  // Timer effect
  useEffect(() => {
    if (!testStarted || testFinished || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          // If time runs out, automatically submit the test
          setTestFinished(true);
          setShowResultDialog(true);
          showError("Time's up! Submitting your test...");
          submitTestResults();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, testStarted, testFinished, submitTestResults]);

  const startTest = async (test: ObjectiveTest) => {
    setSelectedTest(test);
    setLoadingQuestions(true);
    await fetchQuestionsForTest(test.id);
    setLoadingQuestions(false);

    if (questions.length === 0) {
      showError("This test has no questions yet. Please try another test.");
      return;
    }

    setTestStarted(true);
    setTimeLeft(test.duration_minutes * 60); // Convert minutes to seconds
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswersSubmitted({});
    setTestFinished(false);
    setShowResultDialog(false);
    showSuccess(`Objective Test "${test.title}" Started! Good luck!`);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleGoToDashboard = () => {
    setShowResultDialog(false);
    navigate("/student-dashboard");
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
            <CardTitle className="text-3xl font-bold text-primary">Objective Tests</CardTitle>
            <CardDescription className="text-muted-foreground">
              आपकी क्लास की जानकारी नहीं मिली।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-yellow-800 mb-2">ऑब्जेक्टिव टेस्ट देखने के लिए, कृपया अपनी प्रोफ़ाइल में अपनी क्लास अपडेट करें।</p>
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
            <CardTitle className="text-3xl font-bold text-primary">Objective Tests</CardTitle>
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
                {availableTests.map((test) => (
                  <Card key={test.id} className="p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{test.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{test.description}</p>
                      <p className="text-xs text-gray-500">Class: {test.class} | Subject: {test.subject} | Duration: {test.duration_minutes} min</p>
                    </div>
                    <div className="mt-4">
                      <Button onClick={() => startTest(test)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loadingQuestions}>
                        {loadingQuestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Start Test
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-lg text-muted-foreground">
                {selectedSubject ? `No objective tests found for ${selectedSubject} in your class.` : "अभी आपकी क्लास के लिए कोई ऑब्जेक्टिव टेस्ट उपलब्ध नहीं है।"}
              </p>
            )}
          </CardContent>
        </Card>
        <BottomNavigationBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 pb-20 md:pb-8">
      <Card className="w-full max-w-2xl shadow-lg rounded-lg">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <CardTitle className="text-xl font-bold text-primary">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </CardTitle>
            <div className="text-lg font-semibold text-destructive">Time Left: {formatTime(timeLeft)}</div>
          </div>
          <Progress value={progress} className="w-full h-2" />
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-6">{currentQuestion?.question_text}</p>
          <div className="grid grid-cols-1 gap-3">
            {['A', 'B', 'C', 'D'].map((optionKey) => {
              const optionText = currentQuestion?.[`option_${optionKey.toLowerCase()}` as keyof ObjectiveQuestion];
              return (
                <Button
                  key={optionKey}
                  variant={selectedAnswer === optionKey ? "default" : "outline"}
                  onClick={() => handleAnswerSelect(optionKey)}
                  className={selectedAnswer === optionKey ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                >
                  {optionKey}. {optionText}
                </Button>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null && currentQuestionIndex < totalQuestions - 1}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {currentQuestionIndex < totalQuestions - 1 ? "Next Question" : "Submit Test"}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary">Test Completed!</AlertDialogTitle>
            <AlertDialogDescription>
              You have successfully completed the objective test.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-center py-4">
            <p className="text-2xl font-bold mb-2">Your Score:</p>
            <p className="text-4xl font-extrabold text-primary">{score} / {totalQuestions}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleGoToDashboard} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Go to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <BottomNavigationBar />
    </div>
  );
};

export default ObjectiveTestPage;