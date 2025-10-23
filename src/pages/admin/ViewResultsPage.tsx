"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award } from "lucide-react";

const ViewResultsPage = () => {
  return (
    <Card className="w-full shadow-lg rounded-lg text-center p-8">
      <CardHeader>
        <Award className="h-12 w-12 text-primary mx-auto mb-4" />
        <CardTitle className="text-3xl font-bold text-primary">View Results</CardTitle>
        <CardDescription className="text-muted-foreground">
          Access and analyze all student test results.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg text-gray-600 mb-4">
          This module will provide a comprehensive overview of student performance and test results.
        </p>
        <p className="text-md text-gray-500">Full functionality coming soon with Supabase integration!</p>
      </CardContent>
    </Card>
  );
};

export default ViewResultsPage;