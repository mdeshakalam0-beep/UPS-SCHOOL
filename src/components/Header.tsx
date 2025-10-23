"use client";

import React from "react";
import { Bell, School } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Header = () => {
  // Placeholder for notification count
  const notificationCount = 3;

  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-md rounded-lg mb-6">
      {/* Left: School Logo */}
      <div className="flex items-center space-x-2">
        <School className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold text-primary hidden sm:block">UPS PUBLISH SCHOOL</span>
      </div>

      {/* Center: School Name (visible on smaller screens) */}
      <h1 className="text-2xl font-bold text-primary sm:hidden">UPS PUBLISH SCHOOL</h1>

      {/* Right: Notification Icon */}
      <div className="relative">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6 text-gray-600" />
          {notificationCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full">
              {notificationCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
};

export default Header;