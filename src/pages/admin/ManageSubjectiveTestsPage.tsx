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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { FileText, Pencil, Trash2, PlusCircle, Loader2, ListChecks, CalendarIcon, Eye } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/components/SessionContextProvider";

interface SubjectiveTest {
  id: string;
  title: string;
  description: string | null;
  class: string;
  subject: string; // Added subject
  due_date: string; // ISO string
  created_by: string | null;
  created_at: string;
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
  profiles: { first_name: string; last_name: string | null; email: string }; // Joined profile data
  student_subjective_grades: { id: string; grade: number | null; feedback: string | null }[]; // Joined grade data, added id
}

const classes = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];
const subjects = ["Mathematics", "Science", "English", "History", "Geography", "Physics", "Chemistry", "Biology", "Computer Science", "General"]; // Defined subjects

const ManageSubjectiveTestsPage = () => {
  const { user } = useSession();
  const [tests, setTests] = useState<SubjectiveTest[]>([]);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);

  const [editingTest, setEditingTest] = useState<SubjectiveTest | null>(null);
  const [selectedTestForQuestions, setSelectedTestForQuestions] = useState<SubjectiveTest | null>(null);
  const [selectedTestForSubmissions, setSelectedTestForSubmissions] = useState<SubjectiveTest | null>(null);
  const [questions, setQuestions] = useState<SubjectiveQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<SubjectiveQuestion | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [gradingSubmission, setGradingSubmission] = useState<StudentSubmission | null>(null);
  const [gradeData, setGradeData] = useState<{ grade: number | undefined; feedback: string }>({ grade: undefined, feedback: "" });

  const [newTestData, setNewTestData] = useState<{
    title: string;
    description: string;
    class: string;
    subject: string; // Added subject
    due_date: Date | undefined;
  }>({
    title: "",
    description: "",
    class: "",
    subject: "", // Added subject
    due_date: undefined,
  });

  const [newQuestionData, setNewQuestionData] = useState<{
    question_text: string;
  }>({
    question_text: "",
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("subjective_tests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subjective tests:", error);
      showError("Failed to load subjective tests.");
    } else {
      setTests(data as SubjectiveTest[]);
    }
    setLoading(false);
  }, []);

  const fetchQuestions = useCallback(async (testId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("subjective_questions")
      .select("*")
      .eq("test_id", testId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching questions:", error);
      showError("Failed to load questions for this test.");
    } else {
      setQuestions(data as SubjectiveQuestion[]);
    }
    setLoading(false);
  }, []);

  const fetchSubmissions = useCallback(async (testId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("student_subjective_submissions")
      .select(`
        *,
        profiles (first_name, last_name, email),
        student_subjective_grades!fk_submission_id (id, grade, feedback)
      `)
      .eq("test_id", testId)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error fetching submissions:", error);
      showError("Failed to load submissions for this test.");
      setSubmissions([]); // Ensure submissions are cleared on error
    } else {
      setSubmissions(data as StudentSubmission[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // --- Test Management Handlers ---
  const handleTestInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewTestData((prev) => ({ ...prev, [id]: value }));
  };

  const handleTestSelectChange = (id: string, value: string) => {
    setNewTestData((prev) => ({ ...prev, [id]: value }));
  };

  const handleTestDateChange = (date: Date | undefined) => {
    setNewTestData((prev) => ({ ...prev, due_date: date }));
  };

  const handleAddTest = async () => {
    setIsSubmitting(true);
    if (!newTestData.title || !newTestData.class || !newTestData.subject || !newTestData.due_date) {
      showError("Please fill in all required fields (Title, Class, Subject, Due Date).");
      setIsSubmitting(false);
      return;
    }
    if (!user) {
      showError("You must be logged in to add a test.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from("subjective_tests").insert({
        title: newTestData.title,
        description: newTestData.description,
        class: newTestData.class,
        subject: newTestData.subject, // Added subject
        due_date: newTestData.due_date.toISOString(),
        created_by: user.id,
      });

      if (error) {
        throw error;
      }

      showSuccess("Subjective test added successfully!");
      fetchTests();
      handleTestDialogClose();
    } catch (error: any) {
      console.error("Error adding test:", error.message);
      showError(`Failed to add test: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTest = (test: SubjectiveTest) => {
    setEditingTest(test);
    setNewTestData({
      title: test.title,
      description: test.description || "",
      class: test.class,
      subject: test.subject, // Added subject
      due_date: new Date(test.due_date),
    });
    setIsTestDialogOpen(true);
  };

  const handleUpdateTest = async () => {
    setIsSubmitting(true);
    if (!editingTest || !newTestData.title || !newTestData.class || !newTestData.subject || !newTestData.due_date) {
      showError("Please fill in all required fields (Title, Class, Subject, Due Date).");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("subjective_tests")
        .update({
          title: newTestData.title,
          description: newTestData.description,
          class: newTestData.class,
          subject: newTestData.subject, // Added subject
          due_date: newTestData.due_date.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingTest.id);

      if (error) {
        throw error;
      }

      showSuccess("Subjective test updated successfully!");
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
    if (!window.confirm("Are you sure you want to delete this subjective test? All associated questions, submissions, and grades will also be deleted.")) {
      return;
    }

    try {
      const { error } = await supabase.from("subjective_tests").delete().eq("id", id);

      if (error) {
        throw error;
      }

      showSuccess("Subjective test deleted successfully!");
      fetchTests();
    } catch (error: any) {
      console.error("Error deleting test:", error.message);
      showError(`Failed to delete test: ${error.message}`);
    }
  };

  const handleTestDialogClose = () => {
    setIsTestDialogOpen(false);
    setEditingTest(null);
    setNewTestData({ title: "", description: "", class: "", subject: "", due_date: undefined }); // Reset subject
  };

  // --- Question Management Handlers ---
  const handleQuestionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewQuestionData((prev) => ({ ...prev, [id]: value }));
  };

  const handleManageQuestions = (test: SubjectiveTest) => {
    setSelectedTestForQuestions(test);
    fetchQuestions(test.id);
    setIsQuestionDialogOpen(true);
  };

  const handleAddQuestion = async () => {
    setIsSubmitting(true);
    if (!selectedTestForQuestions || !newQuestionData.question_text) {
      showError("Please fill in the question text.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from("subjective_questions").insert({
        test_id: selectedTestForQuestions.id,
        question_text: newQuestionData.question_text,
      });

      if (error) {
        throw error;
      }

      showSuccess("Question added successfully!");
      fetchQuestions(selectedTestForQuestions.id);
      setNewQuestionData({ question_text: "" });
    } catch (error: any) {
      console.error("Error adding question:", error.message);
      showError(`Failed to add question: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditQuestion = (question: SubjectiveQuestion) => {
    setEditingQuestion(question);
    setNewQuestionData({
      question_text: question.question_text,
    });
  };

  const handleUpdateQuestion = async () => {
    setIsSubmitting(true);
    if (!editingQuestion || !selectedTestForQuestions || !newQuestionData.question_text) {
      showError("Please fill in the question text.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("subjective_questions")
        .update({
          question_text: newQuestionData.question_text,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingQuestion.id);

      if (error) {
        throw error;
      }

      showSuccess("Question updated successfully!");
      fetchQuestions(selectedTestForQuestions.id);
      setEditingQuestion(null);
      setNewQuestionData({ question_text: "" });
    } catch (error: any) {
      console.error("Error updating question:", error.message);
      showError(`Failed to update question: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question? All associated student submissions and grades will also be deleted.")) {
      return;
    }
    if (!selectedTestForQuestions) return;

    try {
      const { error } = await supabase.from("subjective_questions").delete().eq("id", id);

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
    setNewQuestionData({ question_text: "" });
  };

  // --- Submission Management Handlers ---
  const handleViewSubmissions = async (test: SubjectiveTest) => {
    setSelectedTestForSubmissions(test);
    await fetchQuestions(test.id); // Fetch questions first
    await fetchSubmissions(test.id); // Then fetch submissions
    setIsSubmissionDialogOpen(true);
  };

  const handleGradeSubmission = (submission: StudentSubmission) => {
    setGradingSubmission(submission);
    const existingGrade = submission.student_subjective_grades?.[0];
    setGradeData({
      grade: existingGrade?.grade || undefined,
      feedback: existingGrade?.feedback || "",
    });
  };

  const handleGradeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setGradeData((prev) => ({ ...prev, [id]: id === "grade" ? Number(value) : value }));
  };

  const handleSaveGrade = async () => {
    setIsSubmitting(true);
    if (!gradingSubmission || gradeData.grade === undefined) {
      showError("Please enter a grade.");
      setIsSubmitting(false);
      return;
    }
    if (!user) {
      showError("You must be logged in to grade submissions.");
      setIsSubmitting(false);
      return;
    }

    try {
      const existingGrade = gradingSubmission.student_subjective_grades?.[0];

      if (existingGrade) {
        // Update existing grade
        const { error } = await supabase
          .from("student_subjective_grades")
          .update({
            grade: gradeData.grade,
            feedback: gradeData.feedback,
            grader_id: user.id,
            graded_at: new Date().toISOString(),
          })
          .eq("id", existingGrade.id); // Corrected: Use the grade's own ID for update

        if (error) throw error;
      } else {
        // Insert new grade
        const { error } = await supabase.from("student_subjective_grades").insert({
          submission_id: gradingSubmission.id,
          grade: gradeData.grade,
          feedback: gradeData.feedback,
          grader_id: user.id,
        });

        if (error) throw error;
      }

      showSuccess("Grade saved successfully!");
      if (selectedTestForSubmissions) {
        fetchSubmissions(selectedTestForSubmissions.id); // Refresh submissions
      }
      setGradingSubmission(null); // Close grading view
      setGradeData({ grade: undefined, feedback: "" });
    } catch (error: any) {
      console.error("Error saving grade:", error.message);
      showError(`Failed to save grade: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmissionDialogClose = () => {
    setIsSubmissionDialogOpen(false);
    setSelectedTestForSubmissions(null);
    setSubmissions([]);
    setGradingSubmission(null);
    setGradeData({ grade: undefined, feedback: "" });
  };

  return (
    <Card className="w-full shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-primary">Manage Subjective Tests</CardTitle>
        <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTest(null); handleTestDialogClose(); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Test
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTest ? "Edit Subjective Test" : "Add New Subjective Test"}</DialogTitle>
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
                <Label htmlFor="due_date" className="text-right">
                  Due Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal col-span-3",
                        !newTestData.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTestData.due_date ? format(newTestData.due_date, "PPP HH:mm") : <span>Pick date and time</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newTestData.due_date}
                      onSelect={handleTestDateChange}
                      initialFocus
                    />
                    <div className="p-3 border-t border-border">
                      <Input
                        type="time"
                        value={newTestData.due_date ? format(newTestData.due_date, "HH:mm") : ""}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':').map(Number);
                          if (newTestData.due_date) {
                            const newDate = new Date(newTestData.due_date);
                            newDate.setHours(hours, minutes);
                            setNewTestData((prev) => ({ ...prev, due_date: newDate }));
                          } else {
                            const now = new Date();
                            now.setHours(hours, minutes);
                            setNewTestData((prev) => ({ ...prev, due_date: now }));
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
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
                <TableHead>Due Date</TableHead>
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
                    <TableCell>{format(new Date(test.due_date), "PPP HH:mm")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleManageQuestions(test)} className="mr-2">
                        <ListChecks className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleViewSubmissions(test)} className="mr-2">
                        <Eye className="h-4 w-4" />
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
                    No subjective tests found. Add a new test to get started!
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
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  {editingQuestion && (
                    <Button variant="outline" onClick={() => { setEditingQuestion(null); setNewQuestionData({ question_text: "" }); }} disabled={isSubmitting}>
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

        {/* Submission Viewing and Grading Dialog */}
        <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submissions for "{selectedTestForSubmissions?.title}"</DialogTitle>
              <CardDescription>View and grade student submissions.</CardDescription>
            </DialogHeader>
            {selectedDoubt && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Student:</Label>
                  <p>{selectedDoubt.profiles?.first_name} {selectedDoubt.profiles?.last_name} ({selectedDoubt.profiles?.email})</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Class / Subject:</Label>
                  <p>{selectedDoubt.class} / {selectedDoubt.subject}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Submitted On:</Label>
                  <p>{format(new Date(selectedDoubt.created_at), "PPP HH:mm")}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Doubt Description:</Label>
                  <Card className="p-3 bg-muted/50">
                    <p className="whitespace-pre-wrap">{selectedDoubt.description}</p>
                  </Card>
                </div>
                {selectedDoubt.attachment_url && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Attachment:</Label>
                    <p>
                      <a href={selectedDoubt.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Attachment ({selectedDoubt.attachment_url.split('/').pop()})
                      </a>
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="resolutionText" className="font-semibold">Resolution:</Label>
                  <Textarea
                    id="resolutionText"
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    rows={6}
                    placeholder="Type your resolution here..."
                    className="w-full"
                    disabled={selectedDoubt.status === 'resolved'}
                  />
                </div>
                {selectedDoubt.status === 'resolved' && (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Resolved by: {selectedDoubt.resolved_by_profile?.first_name} {selectedDoubt.resolved_by_profile?.last_name}</p>
                    <p>Resolved at: {selectedDoubt.resolved_at ? format(new Date(selectedDoubt.resolved_at), "PPP HH:mm") : "N/A"}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>Close</Button>
              {selectedDoubt?.status === 'pending' && (
                <Button onClick={handleSaveResolution} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  Mark as Resolved
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ManageSubjectiveTestsPage;