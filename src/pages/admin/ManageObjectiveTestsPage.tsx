"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { ClipboardCheck, Pencil, Trash2, PlusCircle, Loader2, ListChecks } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/components/SessionContextProvider";

interface ObjectiveTest {
  id: string;
  title: string;
  description: string | null;
  class: string;
  subject: string; // Added subject
  duration_minutes: number;
  created_by: string | null;
  created_at: string;
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

const classes = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];
const subjects = ["Mathematics", "Science", "English", "History", "Geography", "Physics", "Chemistry", "Biology", "Computer Science", "General"]; // Added subjects
const correctOptions = ["A", "B", "C", "D"];

const ManageObjectiveTestsPage = () => {
  const { user } = useSession();
  const [tests, setTests] = useState<ObjectiveTest[]>([]);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<ObjectiveTest | null>(null);
  const [selectedTestForQuestions, setSelectedTestForQuestions] = useState<ObjectiveTest | null>(null);
  const [questions, setQuestions] = useState<ObjectiveQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<ObjectiveQuestion | null>(null);

  const [newTestData, setNewTestData] = useState<{
    title: string;
    description: string;
    class: string;
    subject: string; // Added subject
    duration_minutes: number | undefined;
  }>({
    title: "",
    description: "",
    class: "",
    subject: "", // Added subject
    duration_minutes: undefined,
  });

  const [newQuestionData, setNewQuestionData] = useState<{
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: 'A' | 'B' | 'C' | 'D' | '';
  }>({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "",
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("objective_tests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching objective tests:", error);
      showError("Failed to load objective tests.");
    } else {
      setTests(data as ObjectiveTest[]);
    }
    setLoading(false);
  }, []);

  const fetchQuestions = useCallback(async (testId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("objective_questions")
      .select("*")
      .eq("test_id", testId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching questions:", error);
      showError("Failed to load questions for this test.");
    } else {
      setQuestions(data as ObjectiveQuestion[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // --- Test Management Handlers ---
  const handleTestInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewTestData((prev) => ({ ...prev, [id]: id === "duration_minutes" ? Number(value) : value }));
  };

  const handleTestSelectChange = (id: string, value: string) => {
    setNewTestData((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddTest = async () => {
    setIsSubmitting(true);
    if (!newTestData.title || !newTestData.class || !newTestData.subject || newTestData.duration_minutes === undefined) {
      showError("Please fill in all required fields (Title, Class, Subject, Duration).");
      setIsSubmitting(false);
      return;
    }
    if (!user) {
      showError("You must be logged in to add a test.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from("objective_tests").insert({
        title: newTestData.title,
        description: newTestData.description,
        class: newTestData.class,
        subject: newTestData.subject, // Added subject
        duration_minutes: newTestData.duration_minutes,
        created_by: user.id,
      });

      if (error) {
        throw error;
      }

      showSuccess("Objective test added successfully!");
      fetchTests();
      handleTestDialogClose();
    } catch (error: any) {
      console.error("Error adding test:", error.message);
      showError(`Failed to add test: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTest = (test: ObjectiveTest) => {
    setEditingTest(test);
    setNewTestData({
      title: test.title,
      description: test.description || "",
      class: test.class,
      subject: test.subject, // Added subject
      duration_minutes: test.duration_minutes,
    });
    setIsTestDialogOpen(true);
  };

  const handleUpdateTest = async () => {
    setIsSubmitting(true);
    if (!editingTest || !newTestData.title || !newTestData.class || !newTestData.subject || newTestData.duration_minutes === undefined) {
      showError("Please fill in all required fields (Title, Class, Subject, Duration).");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("objective_tests")
        .update({
          title: newTestData.title,
          description: newTestData.description,
          class: newTestData.class,
          subject: newTestData.subject, // Added subject
          duration_minutes: newTestData.duration_minutes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingTest.id);

      if (error) {
        throw error;
      }

      showSuccess("Objective test updated successfully!");
      fetchTests();
      handleTestDialogClose();
    } catch (error: any) {
      console.error("Error updating test:", error.message);
      showError(`Failed to update test: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this objective test? All associated questions and student results will also be deleted.")) {
      return;
    }

    try {
      const { error } = await supabase.from("objective_tests").delete().eq("id", id);

      if (error) {
        throw error;
      }

      showSuccess("Objective test deleted successfully!");
      fetchTests();
    } catch (error: any) {
      console.error("Error deleting test:", error.message);
      showError(`Failed to delete test: ${error.message}`);
    }
  };

  const handleTestDialogClose = () => {
    setIsTestDialogOpen(false);
    setEditingTest(null);
    setNewTestData({ title: "", description: "", class: "", subject: "", duration_minutes: undefined }); // Reset subject
  };

  // --- Question Management Handlers ---
  const handleQuestionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewQuestionData((prev) => ({ ...prev, [id]: value }));
  };

  const handleQuestionSelectChange = (id: string, value: 'A' | 'B' | 'C' | 'D' | '') => {
    setNewQuestionData((prev) => ({ ...prev, [id]: value }));
  };

  const handleManageQuestions = (test: ObjectiveTest) => {
    setSelectedTestForQuestions(test);
    fetchQuestions(test.id);
    setIsQuestionDialogOpen(true);
  };

  const handleAddQuestion = async () => {
    setIsSubmitting(true);
    if (!selectedTestForQuestions || !newQuestionData.question_text || !newQuestionData.option_a || !newQuestionData.option_b || !newQuestionData.option_c || !newQuestionData.option_d || !newQuestionData.correct_option) {
      showError("Please fill in all required fields for the question.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from("objective_questions").insert({
        test_id: selectedTestForQuestions.id,
        question_text: newQuestionData.question_text,
        option_a: newQuestionData.option_a,
        option_b: newQuestionData.option_b,
        option_c: newQuestionData.option_c,
        option_d: newQuestionData.option_d,
        correct_option: newQuestionData.correct_option,
      });

      if (error) {
        throw error;
      }

      showSuccess("Question added successfully!");
      fetchQuestions(selectedTestForQuestions.id);
      setNewQuestionData({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "" });
    } catch (error: any) {
      console.error("Error adding question:", error.message);
      showError(`Failed to add question: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditQuestion = (question: ObjectiveQuestion) => {
    setEditingQuestion(question);
    setNewQuestionData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_option: question.correct_option,
    });
  };

  const handleUpdateQuestion = async () => {
    setIsSubmitting(true);
    if (!editingQuestion || !selectedTestForQuestions || !newQuestionData.question_text || !newQuestionData.option_a || !newQuestionData.option_b || !newQuestionData.option_c || !newQuestionData.option_d || !newQuestionData.correct_option) {
      showError("Please fill in all required fields for the question.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("objective_questions")
        .update({
          question_text: newQuestionData.question_text,
          option_a: newQuestionData.option_a,
          option_b: newQuestionData.option_b,
          option_c: newQuestionData.option_c,
          option_d: newQuestionData.option_d,
          correct_option: newQuestionData.correct_option,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingQuestion.id);

      if (error) {
        throw error;
      }

      showSuccess("Question updated successfully!");
      fetchQuestions(selectedTestForQuestions.id);
      setEditingQuestion(null);
      setNewQuestionData({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "" });
    } catch (error: any) {
      console.error("Error updating question:", error.message);
      showError(`Failed to update question: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }
    if (!selectedTestForQuestions) return;

    try {
      const { error } = await supabase.from("objective_questions").delete().eq("id", id);

      if (error) {
        throw error;
      }

      showSuccess("Question deleted successfully!");
      fetchQuestions(selectedTestForQuestions.id);
    } catch (error: any) {
      console.error("Error deleting question:", error.message);
      showError(`Failed to delete question: ${error.message}`);
    }
  };

  const handleQuestionDialogClose = () => {
    setIsQuestionDialogOpen(false);
    setSelectedTestForQuestions(null);
    setQuestions([]);
    setEditingQuestion(null);
    setNewQuestionData({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "" });
  };

  return (
    <Card className="w-full shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-primary">Manage Objective Tests</CardTitle>
        <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTest(null); handleTestDialogClose(); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Test
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTest ? "Edit Objective Test" : "Add New Objective Test"}</DialogTitle>
              <CardDescription>{editingTest ? "Update test details." : "Enter new test information."}</CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input id="title" value={newTestData.title} onChange={handleTestInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea id="description" value={newTestData.description} onChange={handleTestInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class" className="text-right">
                  Class
                </Label>
                <Select onValueChange={(value) => handleTestSelectChange("class", value)} value={newTestData.class} required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  Subject
                </Label>
                <Select onValueChange={(value) => handleTestSelectChange("subject", value)} value={newTestData.subject} required>
                  <SelectTrigger className="col-span-3">
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration_minutes" className="text-right">
                  Duration (min)
                </Label>
                <Input id="duration_minutes" type="number" value={newTestData.duration_minutes || ""} onChange={handleTestInputChange} className="col-span-3" required />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleTestDialogClose} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={editingTest ? handleUpdateTest : handleAddTest} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingTest ? "Save Changes" : "Add Test"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading tests...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead> {/* Added Subject column */}
                <TableHead>Duration (min)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.length > 0 ? (
                tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.title}</TableCell>
                    <TableCell>{test.class}</TableCell>
                    <TableCell>{test.subject}</TableCell> {/* Display Subject */}
                    <TableCell>{test.duration_minutes}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleManageQuestions(test)} className="mr-2">
                        <ListChecks className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditTest(test)} className="mr-2">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTest(test.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4"> {/* Adjusted colspan */}
                    No objective tests found. Add a new test to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* Question Management Dialog */}
        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Manage Questions for "{selectedTestForQuestions?.title}"</DialogTitle>
              <CardDescription>Add, edit, or delete questions for this test.</CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Add/Edit Question Form */}
              <Card className="p-4">
                <CardTitle className="text-lg mb-4">{editingQuestion ? "Edit Question" : "Add New Question"}</CardTitle>
                <div className="grid grid-cols-1 gap-3">
                  <Label htmlFor="question_text">Question Text</Label>
                  <Textarea id="question_text" value={newQuestionData.question_text} onChange={handleQuestionInputChange} required />

                  <Label htmlFor="option_a">Option A</Label>
                  <Input id="option_a" value={newQuestionData.option_a} onChange={handleQuestionInputChange} required />

                  <Label htmlFor="option_b">Option B</Label>
                  <Input id="option_b" value={newQuestionData.option_b} onChange={handleQuestionInputChange} required />

                  <Label htmlFor="option_c">Option C</Label>
                  <Input id="option_c" value={newQuestionData.option_c} onChange={handleQuestionInputChange} required />

                  <Label htmlFor="option_d">Option D</Label>
                  <Input id="option_d" value={newQuestionData.option_d} onChange={handleQuestionInputChange} required />

                  <Label htmlFor="correct_option">Correct Option</Label>
                  <Select onValueChange={(value: 'A' | 'B' | 'C' | 'D') => handleQuestionSelectChange("correct_option", value)} value={newQuestionData.correct_option} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct option" />
                    </SelectTrigger>
                    <SelectContent>
                      {correctOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  {editingQuestion && (
                    <Button variant="outline" onClick={() => { setEditingQuestion(null); setNewQuestionData({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "" }); }} disabled={isSubmitting}>
                      Cancel Edit
                    </Button>
                  )}
                  <Button onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingQuestion ? "Save Question" : "Add Question"}
                  </Button>
                </div>
              </Card>

              {/* Questions List */}
              <h3 className="text-xl font-bold mt-6 mb-3">Existing Questions</h3>
              {loading ? (
                <div className="flex justify-center items-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading questions...</span>
                </div>
              ) : questions.length > 0 ? (
                <div className="space-y-3">
                  {questions.map((q, index) => (
                    <Card key={q.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{index + 1}. {q.question_text}</p>
                        <p className="text-sm text-muted-foreground">Correct: {q.correct_option}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditQuestion(q)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No questions added yet for this test.</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleQuestionDialogClose}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ManageObjectiveTestsPage;