"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";

const ManageSubjectiveTestsPage = () => {
  return (
    <Card className="w-full shadow-lg rounded-lg text-center p-8">
      <CardHeader>
        <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
        <CardTitle className="text-3xl font-bold text-primary">Manage Subjective Tests</CardTitle>
        <CardDescription className="text-muted-foreground">
          Create, assign, and grade long-answer tests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg text-gray-600 mb-4">
          This module will allow administrators to manage subjective tests and evaluate student responses.
        </p>
        <p className="text-md text-gray-500">Full functionality coming soon with Supabase integration!</p>
      </CardContent>
    </Card>
  );
};

export default ManageSubjectiveTestsPage;