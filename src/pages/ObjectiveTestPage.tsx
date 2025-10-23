"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/utils/toast";

// Mock data for objective questions
const mockQuestions = [
  {
    id: "q1",
    question: "What is the capital of France?",
    options: ["Berlin", "Madrid", "Paris", "Rome"],
    correctAnswer: "Paris",
  },
  {
    id: "q2",
    question: "Which planet is known as the Red Planet?",
    options: ["Earth", "Mars", "Jupiter", "Venus"],
    correctAnswer: "Mars",
  },
  {
    id: "q3",
    question: "What is 7 + 8?",
    options: ["12", "13", "14", "15"],
    correctAnswer: "15",
  },
  {
    id: "q4",
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctAnswer: "William Shakespeare",
  },
  {
    id: "q5",
    question: "What is the chemical symbol for water?",
    options: ["O2", "H2O", "CO2", "NaCl"],
    correctAnswer: "H2O",
  },
];

const QUESTION_TIME_LIMIT = 60; // 1 minute in seconds

const ObjectiveTestPage = () => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const currentQuestion = mockQuestions[currentQuestionIndex];
  const totalQuestions = mockQuestions.length;
  const progress = ((currentQuestionIndex + (testFinished ? 1 : 0)) / totalQuestions) * 100;

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const evaluateAnswer = useCallback(() => {
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore((prevScore) => prevScore + 1);
    }
  }, [selectedAnswer, currentQuestion]);

  const handleNextQuestion = useCallback(() => {
    evaluateAnswer();
    setSelectedAnswer(null); // Reset selected answer for next question

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setTimeLeft(QUESTION_TIME_LIMIT); // Reset timer for next question
    } else {
      setTestFinished(true);
      setShowResultDialog(true);
      toast.showSuccess("Test completed! Calculating results...");
    }
  }, [currentQuestionIndex, totalQuestions, evaluateAnswer]);

  // Timer effect
  useEffect(() => {
    if (!testStarted || testFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleNextQuestion(); // Auto-advance on timer end
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, testStarted, testFinished, handleNextQuestion]);

  const startTest = () => {
    setTestStarted(true);
    toast.showSuccess("Objective Test Started! Good luck!");
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

  if (!testStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg rounded-lg text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Objective Test</CardTitle>
            <CardDescription>Ready to test your knowledge?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground mb-4">
              You will have {QUESTION_TIME_LIMIT / 60} minute per question.
            </p>
            <Button onClick={startTest} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Start Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
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
          <p className="text-lg mb-6">{currentQuestion.question}</p>
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option) => (
              <Button
                key={option}
                variant={selectedAnswer === option ? "default" : "outline"}
                onClick={() => handleAnswerSelect(option)}
                className={selectedAnswer === option ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
              >
                {option}
              </Button>
            ))}
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
    </div>
  );
};

export default ObjectiveTestPage;