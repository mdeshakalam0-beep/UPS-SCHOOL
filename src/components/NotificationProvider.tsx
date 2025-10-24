"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSession } from '@/components/SessionContextProvider';
import { showError, showSuccess } from '@/utils/toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  sound_url: string | null;
  class_target: string | null;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAllAsRead: () => void; // Changed to markAllAsRead
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: sessionLoading } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userClassRef = useRef<string | null>(null); // Ref to store user's class

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = useCallback((soundUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = soundUrl;
      audioRef.current.play().catch(e => console.error("Error playing sound:", e));
    }
  }, []);

  const fetchUserClass = useCallback(async () => {
    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('class')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user profile for notifications:", error);
        userClassRef.current = null;
      } else if (profile) {
        userClassRef.current = profile.class;
      } else {
        userClassRef.current = null;
      }
    } else {
      userClassRef.current = null;
    }
  }, [user]);

  const fetchInitialNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    await fetchUserClass(); // Ensure user class is fetched before querying notifications

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20); // Limit to recent notifications

    // Apply class filtering if userClass is available
    if (userClassRef.current) {
      query = query.or(`class_target.is.null,class_target.eq.${userClassRef.current}`);
    } else {
      // If user has no class, only show global notifications
      query = query.is('class_target', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching initial notifications:", error);
      showError("Failed to load notifications.");
    } else {
      setNotifications(data || []);
      // For simplicity, initially all fetched notifications are considered "read"
      // A more robust system would involve a separate 'read_notifications' table
      setUnreadCount(0); // On initial load, assume no unread count
    }
  }, [user, fetchUserClass]);

  useEffect(() => {
    if (!sessionLoading && user) {
      fetchInitialNotifications();

      const channel = supabase
        .channel('public:notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          async (payload) => {
            const newNotification = payload.new as Notification;
            
            // Re-fetch user class to ensure it's up-to-date
            await fetchUserClass();

            // Check if the notification is relevant to the current user
            const isGlobal = newNotification.class_target === null;
            const isTargetedToUserClass = newNotification.class_target === userClassRef.current;

            if (isGlobal || isTargetedToUserClass) {
              setNotifications((prev) => [newNotification, ...prev].slice(0, 20)); // Keep only recent 20
              setUnreadCount((prev) => prev + 1); // Increment unread count for new notification
              showSuccess(newNotification.title, { description: newNotification.message });
              if (newNotification.sound_url) {
                playNotificationSound(newNotification.sound_url);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else if (!sessionLoading && !user) {
      // Clear notifications if user logs out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [sessionLoading, user, fetchInitialNotifications, playNotificationSound, fetchUserClass]);

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0); // Reset unread count when notifications are viewed
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, clearAllNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};