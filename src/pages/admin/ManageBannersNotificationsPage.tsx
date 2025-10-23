"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Image, BellRing } from "lucide-react";

const ManageBannersNotificationsPage = () => {
  return (
    <Card className="w-full shadow-lg rounded-lg text-center p-8">
      <CardHeader>
        <div className="flex items-center justify-center space-x-4 mx-auto mb-4">
          <Image className="h-12 w-12 text-primary" />
          <BellRing className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold text-primary">Manage Banners & Notifications</CardTitle>
        <CardDescription className="text-muted-foreground">
          Control homepage banners and send announcements.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg text-gray-600 mb-4">
          This module will allow administrators to update homepage banners and send notifications to students.
        </p>
        <p className="text-md text-gray-500">Full functionality coming soon with Supabase integration!</p>
      </CardContent>
    </Card>
  );
};

export default ManageBannersNotificationsPage;