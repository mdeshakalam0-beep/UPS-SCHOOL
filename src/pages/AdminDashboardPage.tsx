"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";

const AdminDashboardPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-primary">Welcome, Admin!</h1>
        <p className="text-xl text-muted-foreground">This is your Admin Dashboard.</p>
        <p className="text-lg text-muted-foreground mt-2">Full management control coming soon!</p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default AdminDashboardPage;