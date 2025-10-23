"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { Pencil, Trash2, PlusCircle } from "lucide-react";

interface Student {
  id: string;
  name: string;
  class: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
}

const mockStudents: Student[] = [
  { id: "1", name: "Alice Smith", class: "10th", dob: "2008-05-15", gender: "Female", mobile: "9876543210", email: "alice@example.com" },
  { id: "2", name: "Bob Johnson", class: "9th", dob: "2009-11-22", gender: "Male", mobile: "9988776655", email: "bob@example.com" },
  { id: "3", name: "Charlie Brown", class: "11th", dob: "2007-03-01", gender: "Male", mobile: "9123456789", email: "charlie@example.com" },
];

const ManageStudentsPage = () => {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudentData, setNewStudentData] = useState<Omit<Student, "id">>({
    name: "",
    class: "",
    dob: "",
    gender: "",
    mobile: "",
    email: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewStudentData((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddStudent = () => {
    if (!newStudentData.name || !newStudentData.class || !newStudentData.email) {
      showError("Please fill in all required fields.");
      return;
    }
    const newStudent: Student = {
      ...newStudentData,
      id: String(students.length + 1), // Simple ID generation
    };
    setStudents((prev) => [...prev, newStudent]);
    showSuccess("Student added successfully!");
    setNewStudentData({ name: "", class: "", dob: "", gender: "", mobile: "", email: "" });
    setIsDialogOpen(false);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setNewStudentData({ ...student }); // Populate form with existing data
    setIsDialogOpen(true);
  };

  const handleUpdateStudent = () => {
    if (!editingStudent || !newStudentData.name || !newStudentData.class || !newStudentData.email) {
      showError("Please fill in all required fields.");
      return;
    }
    setStudents((prev) =>
      prev.map((s) => (s.id === editingStudent.id ? { ...newStudentData, id: editingStudent.id } : s))
    );
    showSuccess("Student updated successfully!");
    setEditingStudent(null);
    setNewStudentData({ name: "", class: "", dob: "", gender: "", mobile: "", email: "" });
    setIsDialogOpen(false);
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
      showSuccess("Student deleted successfully!");
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingStudent(null);
    setNewStudentData({ name: "", class: "", dob: "", gender: "", mobile: "", email: "" });
  };

  return (
    <Card className="w-full shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-primary">Manage Students</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingStudent(null); setNewStudentData({ name: "", class: "", dob: "", gender: "", mobile: "", email: "" }); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
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
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" value={newStudentData.name} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class" className="text-right">
                  Class
                </Label>
                <Input id="class" value={newStudentData.class} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dob" className="text-right">
                  DOB
                </Label>
                <Input id="dob" type="date" value={newStudentData.dob} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">
                  Gender
                </Label>
                <Input id="gender" value={newStudentData.gender} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mobile" className="text-right">
                  Mobile
                </Label>
                <Input id="mobile" type="tel" value={newStudentData.mobile} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" type="email" value={newStudentData.email} onChange={handleInputChange} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
              <Button onClick={editingStudent ? handleUpdateStudent : handleAddStudent} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {editingStudent ? "Save Changes" : "Add Student"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>DOB</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.class}</TableCell>
                <TableCell>{student.dob}</TableCell>
                <TableCell>{student.gender}</TableCell>
                <TableCell>{student.mobile}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEditStudent(student)} className="mr-2">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteStudent(student.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {students.length === 0 && (
          <p className="text-center text-muted-foreground mt-4">No students found. Add a new student to get started!</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageStudentsPage;