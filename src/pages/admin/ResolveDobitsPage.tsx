"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

const ResolveDobitsPage = () => {
  return (
    <Card className="w-full shadow-lg rounded-lg text-center p-8">
      <CardHeader>
        <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
        <CardTitle className="text-3xl font-bold text-primary">Resolve Dobits</CardTitle>
        <CardDescription className="text-muted-foreground">
          View and provide solutions to student doubts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg text-gray-600 mb-4">
          This module will help administrators manage and resolve student doubts submitted through the Dobit Box.
        </p>
        <p className="text-md text-gray-500">Full functionality coming soon with Supabase integration!</p>
      </CardContent>
    </Card>
  );
};

export default ResolveDobitsPage;