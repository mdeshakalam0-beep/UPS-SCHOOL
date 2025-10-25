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
import { Loader2, User, ArrowLeft, Clock, CheckCircle, BookOpen, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ObjectiveTest {
  id: string;
  title: string;
  description: string | null;
  class: string;
  subject: string;
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

const subjects = ["Mathematics", "Science", "English", "History", "Geography", "Physics", "Chemistry", "Biology", "Computer Science", "General"];

const ObjectiveTestPage = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [availableTests, setAvailableTests] = useState<ObjectiveTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ObjectiveTest | null>(null);
  const [questions, setQuestions] = useState<ObjectiveQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [userClass, setUserClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [answersSubmitted, setAnswersSubmitted] = useState<{ [key: string]: string }>({});
  const [testStartTime, setTestStartTime] = useState<Date | null>(null); // New state for test start time

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
  }, [user, selectedSubject]);

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
    if (!user || !selectedTest || !testStartTime) { // Ensure testStartTime is available
      showError("User, test, or start time not found for submitting results.");
      return;
    }

    try {
      const { error } = await supabase.from("student_objective_results").insert({
        user_id: user.id,
        test_id: selectedTest.id,
        score: score,
        total_questions: totalQuestions,
        started_at: testStartTime.toISOString(), // Include started_at
        submitted_at: new Date().toISOString(), // Current time as submitted_at
      });

      if (error) {
        throw error;
      }
      console.log("Test results submitted successfully!");
    } catch (error: any) {
      console.error("Error submitting test results:", error.message);
      showError(`Failed to submit test results: ${error.message}`);
    }
  }, [user, selectedTest, score, totalQuestions, testStartTime]);

  const handleNextQuestion = useCallback(() => {
    evaluateAnswer();
    setSelectedAnswer(null);

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } else {
      setTestFinished(true);
      setShowResultDialog(true);
      showSuccess("Test completed! Calculating results...");
      submitTestResults();
    }
  }, [currentQuestionIndex, totalQuestions, evaluateAnswer, submitTestResults]);

  // Timer effect
  useEffect(() => {
    if (!testStarted || testFinished || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
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
    setTimeLeft(test.duration_minutes * 60);
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswersSubmitted({});
    setTestFinished(false);
    setShowResultDialog(false);
    setTestStartTime(new Date()); // Record the start time
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
            <CardTitle className="text-3xl font-bold">Objective Tests</CardTitle>
            <CardDescription className="text-blue-100 mt-2">
              आपकी क्लास की जानकारी नहीं मिली।
            </CardDescription>
          </div>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold text-slate-700 mb-6">ऑब्जेक्टिव टेस्ट देखने के लिए, कृपया अपनी प्रोफ़ाइल में अपनी क्लास अपडेट करें।</p>
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
        <div className="w-full max-w-4xl mb-6">
          <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2 bg-white shadow-md hover:shadow-lg transition-shadow">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
        <Card className="w-full max-w-4xl shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <CardTitle className="text-3xl font-bold text-center">Objective Tests</CardTitle>
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
                {availableTests.map((test) => (
                  <Card key={test.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">{test.title}</h3>
                      <p className="text-sm text-slate-600 mb-3">{test.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                          Class: {test.class}
                        </Badge>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                          {test.subject}
                        </Badge>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                          <Clock className="h-3 w-3 mr-1" />
                          {test.duration_minutes} min
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <Button 
                        onClick={() => startTest(test)} 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300" 
                        disabled={loadingQuestions}
                      >
                        {loadingQuestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
                        Start Test
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-lg text-slate-600">
                  {selectedSubject ? `No objective tests found for ${selectedSubject} in your class.` : "अभी आपकी क्लास के लिए कोई ऑब्जेक्टिव टेस्ट उपलब्ध नहीं है।"}
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-20 md:pb-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <Card className="w-full max-w-3xl shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-center mb-4">
            <CardTitle className="text-xl font-bold">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </CardTitle>
            <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
              <Clock className="h-5 w-5" />
              <span className="font-semibold">{formatTime(timeLeft)}</span>
            </div>
          </div>
          <Progress value={progress} className="w-full h-3 bg-white/30" />
        </CardHeader>
        <CardContent className="p-8">
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-slate-800 mb-6">{currentQuestion?.question_text}</h3>
            <div className="grid grid-cols-1 gap-4">
              {['A', 'B', 'C', 'D'].map((optionKey) => {
                const optionText = currentQuestion?.[`option_${optionKey.toLowerCase()}` as keyof ObjectiveQuestion];
                return (
                  <Button
                    key={optionKey}
                    variant={selectedAnswer === optionKey ? "default" : "outline"}
                    onClick={() => handleAnswerSelect(optionKey)}
                    className={`p-4 text-left justify-start h-auto transition-all duration-300 ${
                      selectedAnswer === optionKey 
                        ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                        : "bg-white hover:bg-blue-50 border-slate-300 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        selectedAnswer === optionKey 
                          ? "bg-white text-blue-600" 
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {optionKey}
                      </div>
                      <span>{optionText}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 p-6">
          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null && currentQuestionIndex < totalQuestions - 1}
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
          >
            {currentQuestionIndex < totalQuestions - 1 ? "Next Question" : "Submit Test"}
            {currentQuestionIndex < totalQuestions - 1 && <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />}
            {currentQuestionIndex === totalQuestions - 1 && <CheckCircle className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-slate-800">Test Completed!</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              You have successfully completed the objective test.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-center py-4">
            <p className="text-lg text-slate-600 mb-2">Your Score:</p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-4xl font-extrabold text-blue-600">{score}</span>
              <span className="text-2xl text-slate-400">/</span>
              <span className="text-2xl font-bold text-slate-600">{totalQuestions}</span>
            </div>
            <div className="mt-4">
              <Progress value={(score / totalQuestions) * 100} className="h-3" />
              <p className="text-sm text-slate-500 mt-1">
                {Math.round((score / totalQuestions) * 100)}% Correct
              </p>
            </div>
          </div>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction 
              onClick={handleGoToDashboard} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
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