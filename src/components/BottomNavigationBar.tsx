"use client";

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ClipboardCheck, Award, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Home", icon: Home, path: "/student-dashboard" },
  { name: "Objective Test", icon: ClipboardCheck, path: "/objective-test" },
  { name: "Results", icon: Award, path: "/results" },
  { name: "Dobit Box", icon: MessageSquare, path: "/dobit-box" },
  { name: "Profile", icon: User, path: "/profile" },
];

const BottomNavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Do not show bottom navigation bar on the login page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200 flex justify-around items-center py-3 min-h-[4rem] md:hidden">
      {navItems.map((item) => (
        <Button
          key={item.name}
          variant="ghost"
          className={cn(
            "flex flex-col items-center justify-center p-1 h-auto text-center space-y-1 flex-1 min-w-0",
            location.pathname === item.path ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
          )}
          onClick={() => navigate(item.path)}
        >
          <item.icon className="h-5 w-5" />
          <span className="text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>
        </Button>
      ))}
    </div>
  );
};

export default BottomNavigationBar;