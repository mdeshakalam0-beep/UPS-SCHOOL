"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const ManageNotesPage = () => {
  return (
    <Card className="w-full shadow-lg rounded-lg text-center p-8">
      <CardHeader>
        <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
        <CardTitle className="text-3xl font-bold text-primary">Manage Notes / PDFs</CardTitle>
        <CardDescription className="text-muted-foreground">
          Upload, edit, and organize study materials for students.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg text-gray-600 mb-4">
          This module will allow administrators to manage all notes and PDF documents.
        </p>
        <p className="text-md text-gray-500">Full functionality coming soon with Supabase integration!</p>
      </CardContent>
    </Card>
  );
};

export default ManageNotesPage;