"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { Pencil, Trash2, PlusCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient"; // Supabase क्लाइंट इम्पोर्ट करें

interface Student {
  id: string;
  first_name: string;
  last_name: string | null;
  class: string | null;
  date_of_birth: string | null; // Stored as string (YYYY-MM-DD)
  gender: string | null;
  mobile_number: string | null;
  email: string; // Now directly from profiles table
  role: string;
}

const ManageStudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudentData, setNewStudentData] = useState<Partial<Student>>({
    first_name: "",
    last_name: "",
    class: "",
    date_of_birth: "",
    gender: "",
    mobile_number: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, class, date_of_birth, gender, mobile_number, role, email") // Fetch email directly from profiles
      .order("first_name", { ascending: true });

    if (error) {
      console.error("Error fetching students:", error);
      showError("Failed to load students.");
    } else {
      // Map the data to the Student interface
      const formattedStudents: Student[] = data.map((profile: any) => ({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        class: profile.class,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        mobile_number: profile.mobile_number,
        email: profile.email || "N/A", // Use email from profiles table
        role: profile.role,
      }));
      setStudents(formattedStudents);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewStudentData((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddStudent = async () => {
    setIsSubmitting(true);
    if (!newStudentData.first_name || !newStudentData.email || !newStudentData.class || !newStudentData.mobile_number) {
      showError("Please fill in all required fields (First Name, Email, Class, Mobile Number).");
      setIsSubmitting(false);
      return;
    }

    try {
      // For adding a new student, we'd typically create a new user in auth.users first,
      // which would then trigger handle_new_user to create a profile.
      // For simplicity here, we'll assume the admin is adding a profile for an *existing* user
      // or that the user will sign up separately.
      // A more robust solution would involve creating the user via admin API or inviting them.
      // For now, we'll focus on managing existing profiles or profiles created via signup.
      showError("Adding new students directly from this panel is not yet supported. Please ask the student to sign up first.");
      setIsSubmitting(false);
      return;
    } catch (error: any) {
      console.error("Error adding student:", error.message);
      showError(`Failed to add student: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setNewStudentData({
      first_name: student.first_name,
      last_name: student.last_name,
      class: student.class,
      date_of_birth: student.date_of_birth,
      gender: student.gender,
      mobile_number: student.mobile_number,
      email: student.email, // Email is now editable if it's in the profiles table
    });
    setIsDialogOpen(true);
  };

  const handleUpdateStudent = async () => {
    setIsSubmitting(true);
    if (!editingStudent || !newStudentData.first_name || !newStudentData.class || !newStudentData.mobile_number) {
      showError("Please fill in all required fields (First Name, Class, Mobile Number).");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: newStudentData.first_name,
          last_name: newStudentData.last_name,
          class: newStudentData.class,
          date_of_birth: newStudentData.date_of_birth,
          gender: newStudentData.gender,
          mobile_number: newStudentData.mobile_number,
          email: newStudentData.email, // Update email if it's changed
          // role: newStudentData.role, // Role change should be handled carefully, not via this form
        })
        .eq("id", editingStudent.id);

      if (error) {
        throw error;
      }

      showSuccess("Student updated successfully!");
      fetchStudents();
      handleDialogClose();
    } catch (error: any) {
      console.error("Error updating student:", error.message);
      showError(`Failed to update student: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this student? This will also delete their user account.")) {
      return;
    }

    try {
      // Deleting the user from auth.users will cascade delete their profile due to foreign key constraint
      const { error: authError } = await supabase.auth.admin.deleteUser(id);

      if (authError) {
        throw authError;
      }

      showSuccess("Student and associated user account deleted successfully!");
      fetchStudents();
    } catch (error: any) {
      console.error("Error deleting student:", error.message);
      showError(`Failed to delete student: ${error.message}`);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingStudent(null);
    setNewStudentData({
      first_name: "",
      last_name: "",
      class: "",
      date_of_birth: "",
      gender: "",
      mobile_number: "",
      email: "",
    });
  };

  return (
    <Card className="w-full shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-primary">Manage Students</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingStudent(null); setNewStudentData({ first_name: "", last_name: "", class: "", date_of_birth: "", gender: "", mobile_number: "", email: "" }); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
              <CardDescription>{editingStudent ? "Update student details." : "Enter new student information."}</CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="first_name" className="text-right">
                  First Name
                </Label>
                <Input id="first_name" value={newStudentData.first_name || ""} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="last_name" className="text-right">
                  Last Name
                </Label>
                <Input id="last_name" value={newStudentData.last_name || ""} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" type="email" value={newStudentData.email || ""} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class" className="text-right">
                  Class
                </Label>
                <Input id="class" value={newStudentData.class || ""} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date_of_birth" className="text-right">
                  DOB
                </Label>
                <Input id="date_of_birth" type="date" value={newStudentData.date_of_birth || ""} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">
                  Gender
                </Label>
                <Input id="gender" value={newStudentData.gender || ""} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mobile_number" className="text-right">
                  Mobile
                </Label>
                <Input id="mobile_number" type="tel" value={newStudentData.mobile_number || ""} onChange={handleInputChange} className="col-span-3" required />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={editingStudent ? handleUpdateStudent : handleAddStudent} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingStudent ? "Save Changes" : "Add Student"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading students...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.first_name} {student.last_name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.date_of_birth}</TableCell>
                    <TableCell>{student.gender}</TableCell>
                    <TableCell>{student.mobile_number}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditStudent(student)} className="mr-2">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteStudent(student.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageStudentsPage;