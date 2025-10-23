"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/utils/toast";

// Mock data for subjective questions
const mockSubjectiveQuestions = [
  {
    id: "sq1",
    question: "Explain the concept of photosynthesis in your own words.",
  },
  {
    id: "sq2",
    question: "Describe the main causes and effects of climate change.",
  },
  {
    id: "sq3",
    question: "Analyze a significant historical event and its impact on modern society.",
  },
];

const SubjectiveTestPage = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [attachments, setAttachments] = useState<{ [key: string]: File | null }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleAttachmentChange = (questionId: string, file: File | null) => {
    setAttachments((prev) => ({ ...prev, [questionId]: file }));
  };

  const handleSubmitTest = async () => {
    setIsSubmitting(true);
    // In a real application, you would send `answers` and `attachments` to your backend (e.g., Supabase)
    console.log("Submitting answers:", answers);
    console.log("Submitting attachments:", attachments);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.showSuccess("Subjective test submitted successfully! Results will be available after admin review.");
    setIsSubmitting(false);
    navigate("/student-dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-3xl shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Subjective Test</CardTitle>
          <CardDescription className="text-muted-foreground">
            Provide detailed answers to the questions below. You can also attach relevant files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {mockSubjectiveQuestions.map((q, index) => (
            <div key={q.id} className="border-b pb-6 last:border-b-0">
              <h3 className="text-lg font-semibold mb-3">
                {index + 1}. {q.question}
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
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-end pt-6">
          <Button
            onClick={handleSubmitTest}
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? "Submitting..." : "Submit Test"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SubjectiveTestPage;