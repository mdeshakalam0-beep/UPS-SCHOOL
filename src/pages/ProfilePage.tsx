"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, User } from "lucide-react";

const ProfilePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mb-6">
        <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>
      <Card className="w-full max-w-4xl shadow-lg rounded-lg text-center p-8">
        <CardHeader>
          <User className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">My Profile</CardTitle>
          <CardDescription className="text-muted-foreground">
            View and manage your personal information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-gray-600 mb-4">
            This page will display your profile details and allow you to update them.
          </p>
          <p className="text-md text-gray-500">Content coming soon with Supabase integration!</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;