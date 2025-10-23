"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import BottomNavigationBar from "@/components/BottomNavigationBar"; // Import BottomNavigationBar

const RecordedClassPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 sm:p-6 lg:p-8 pb-20 md:pb-8"> {/* Adjusted padding-bottom */}
      <div className="w-full max-w-4xl mb-6">
        <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>
      <Card className="w-full max-w-4xl shadow-lg rounded-lg text-center p-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Recorded Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-muted-foreground mb-4">
            This page will display a list of recorded classes.
          </p>
          <p className="text-md text-gray-500">Content coming soon!</p>
        </CardContent>
      </Card>
      <BottomNavigationBar /> {/* Add the bottom navigation bar here */}
    </div>
  );
};

export default RecordedClassPage;