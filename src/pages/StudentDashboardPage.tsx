"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";

const StudentDashboardPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-primary">Welcome, Student!</h1>
        <p className="text-xl text-muted-foreground">This is your Student Dashboard.</p>
        <p className="text-lg text-muted-foreground mt-2">More features coming soon!</p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default StudentDashboardPage;