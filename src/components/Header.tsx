"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bell, School, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/components/NotificationProvider";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabaseClient"; // Import supabase client
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components

interface SchoolSettings {
  school_name: string;
  school_logo_url: string | null;
}

const Header = () => {
  const { notifications, unreadCount, markAllAsRead, clearAllNotifications } = useNotifications();
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const fetchSchoolSettings = useCallback(async () => {
    setLoadingSettings(true);
    const { data, error } = await supabase
      .from("school_settings")
      .select("school_name, school_logo_url")
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
      console.error("Error fetching school settings:", error);
      // Fallback to default values
      setSchoolSettings({ school_name: "UPS PUBLISH SCHOOL", school_logo_url: null });
    } else if (data) {
      setSchoolSettings(data as SchoolSettings);
    } else {
      // No settings found, use default
      setSchoolSettings({ school_name: "UPS PUBLISH SCHOOL", school_logo_url: null });
    }
    setLoadingSettings(false);
  }, []);

  useEffect(() => {
    fetchSchoolSettings();
  }, [fetchSchoolSettings]);

  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-md rounded-lg mb-6">
      {/* Left: School Logo and Name */}
      <div className="flex items-center space-x-2">
        {loadingSettings ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <>
            <Avatar className="h-8 w-8">
              <AvatarImage src={schoolSettings?.school_logo_url || undefined} alt="School Logo" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <School className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <span className="text-xl font-bold text-primary hidden sm:block">
              {schoolSettings?.school_name || "UPS PUBLISH SCHOOL"}
            </span>
          </>
        )}
      </div>

      {/* Center: School Name (visible on smaller screens) */}
      <h1 className="text-2xl font-bold text-primary sm:hidden">
        {loadingSettings ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : schoolSettings?.school_name || "UPS PUBLISH SCHOOL"}
      </h1>

      {/* Right: Notification Icon */}
      <div className="relative">
        <DropdownMenu onOpenChange={(open) => {
          if (open) {
            markAllAsRead(); // Mark all as read when dropdown is opened
          }
        }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-6 w-6 text-gray-600" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-0" align="end">
            <DropdownMenuLabel className="flex items-center justify-between px-4 py-2">
              <span>Notifications</span>
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllNotifications} className="text-xs text-muted-foreground hover:text-destructive">
                  Clear All
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 cursor-default hover:bg-accent/50">
                    <p className="font-semibold text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </DropdownMenuItem>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">No new notifications.</p>
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;