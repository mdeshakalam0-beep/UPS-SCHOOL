"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import Header from "@/components/Header";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, MonitorPlay, ClipboardCheck, FileText, Award, Book, MessageSquare, Loader2, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import Autoplay from "embla-carousel-autoplay"; // Import Autoplay
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // New import for Avatar

interface Banner {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  is_active: boolean;
}

interface TopStudent {
  id: string; // User ID
  first_name: string;
  last_name: string | null;
  class: string | null;
  avatar_url: string | null;
  latest_score: number;
  test_title: string;
  submitted_at: string;
}

const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]); // New state for top students
  const [loadingTopStudents, setLoadingTopStudents] = useState(true); // New state for loading top students

  const quickAccessItems = [
    { name: "Recorded Class", icon: Video, path: "/recorded-class" },
    { name: "Live Class", icon: MonitorPlay, path: "/live-class" },
    { name: "Objective Test", icon: ClipboardCheck, path: "/objective-test" },
    { name: "Subjective Test", icon: FileText, path: "/subjective-test" },
    { name: "Results", icon: Award, path: "/results" },
    { name: "Notes/PDF", icon: Book, path: "/notes-pdf" },
    { name: "Dobit Box", icon: MessageSquare, path: "/dobit-box" }, // Updated path
  ];

  const fetchActiveBanners = useCallback(async () => {
    setLoadingBanners(true);
    const { data, error } = await supabase
      .from("banners")
      .select("id, title, description, image_url")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching active banners:", error);
      showError("Failed to load banners.");
      setBanners([]);
    } else {
      setBanners(data as Banner[]);
    }
    setLoadingBanners(false);
  }, []);

  const fetchTopStudents = useCallback(async () => {
    setLoadingTopStudents(true);
    // Fetch all objective test results, ordered by submission time descending
    const { data, error } = await supabase
      .from('student_objective_results')
      .select(`
        user_id,
        score,
        submitted_at,
        objective_tests (title),
        profiles (first_name, last_name, avatar_url, class)
      `)
      .order('submitted_at', { ascending: false }); // Order by latest submission first

    if (error) {
      console.error("Error fetching top students:", error);
      showError("Failed to load top students.");
      setTopStudents([]);
    } else {
      // Process data to get the latest score for each unique user
      const latestScoresByUser: { [userId: string]: TopStudent } = {};
      data.forEach((result: any) => {
        // Only consider the latest submission for each user
        if (!latestScoresByUser[result.user_id] || new Date(result.submitted_at) > new Date(latestScoresByUser[result.user_id].submitted_at)) {
          latestScoresByUser[result.user_id] = {
            id: result.user_id,
            first_name: result.profiles?.first_name || 'Unknown',
            last_name: result.profiles?.last_name,
            class: result.profiles?.class,
            avatar_url: result.profiles?.avatar_url,
            latest_score: result.score,
            test_title: result.objective_tests?.title || 'N/A',
            submitted_at: result.submitted_at,
          };
        }
      });

      // Convert to array, sort by score (descending), and take top 3
      const sortedTopStudents = Object.values(latestScoresByUser)
        .sort((a, b) => b.latest_score - a.latest_score)
        .slice(0, 3);

      setTopStudents(sortedTopStudents);
    }
    setLoadingTopStudents(false);
  }, []);

  useEffect(() => {
    fetchActiveBanners();
    fetchTopStudents(); // Initial fetch for top students

    // Realtime subscription for objective test results
    const resultsChannel = supabase
      .channel('top_students_results_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_objective_results' },
        (payload) => {
          console.log('Realtime change in student_objective_results:', payload);
          fetchTopStudents(); // Re-fetch top students on any change
        }
      )
      .subscribe();

    // Realtime subscription for profile changes (e.g., avatar_url, name)
    const profilesChannel = supabase
      .channel('top_students_profiles_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Realtime change in profiles:', payload);
          // Re-fetch top students if any profile is updated, as it might affect their display
          fetchTopStudents();
        }
      )
      .subscribe();

    return () => {
      resultsChannel.unsubscribe();
      profilesChannel.unsubscribe();
    };
  }, [fetchActiveBanners, fetchTopStudents]); // Removed topStudents from dependencies to prevent potential infinite loop

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <Header />

      {/* Hero Banner (Auto Slider) */}
      <section className="mb-8">
        {loadingBanners ? (
          <div className="flex justify-center items-center h-48 bg-muted rounded-lg shadow-md">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading banners...</span>
          </div>
        ) : banners.length > 0 ? (
          <Carousel
            plugins={[
              Autoplay({
                delay: 4000, // 4 seconds
                stopOnInteraction: false, // Continue autoplay even after user interaction
              }),
            ]}
            className="w-full max-w-4xl mx-auto"
          >
            <CarouselContent>
              {banners.map((banner) => (
                <CarouselItem key={banner.id}>
                  <div className="p-1">
                    <Card className="overflow-hidden rounded-lg shadow-md">
                      <img src={banner.image_url} alt={banner.title} className="w-full h-48 object-cover rounded-lg" />
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        ) : (
          <div className="flex justify-center items-center h-48 bg-muted rounded-lg shadow-md">
            <p className="text-muted-foreground">No active banners available.</p>
          </div>
        )}
      </section>

      {/* Quick Access Buttons */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4 text-center">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {quickAccessItems.map((item) => (
            <Button
              key={item.name}
              variant="outline"
              className="flex flex-col items-center justify-center p-4 h-auto text-center space-y-2 shadow-sm hover:shadow-md transition-shadow duration-200"
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">{item.name}</span>
            </Button>
          ))}
        </div>
      </section>

      {/* Top 3 Students Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4 text-center">Top 3 Students</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {loadingTopStudents ? (
            <div className="md:col-span-3 flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading top students...</span>
            </div>
          ) : topStudents.length > 0 ? (
            topStudents.map((student, index) => (
              <Card key={student.id} className="shadow-md rounded-lg p-4 text-center">
                <CardHeader className="pb-2">
                  <div className="relative mx-auto mb-2 w-20 h-20">
                    <Avatar className="w-20 h-20 mx-auto">
                      <AvatarImage src={student.avatar_url || undefined} alt={`${student.first_name} Avatar`} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                        {student.first_name ? student.first_name[0].toUpperCase() : <UserIcon className="h-10 w-10" />}
                      </AvatarFallback>
                    </Avatar>
                    <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                      #{index + 1}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold">
                    {student.first_name} {student.last_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Class: {student.class || "N/A"}</p>
                  <p>Latest Score: <span className="font-medium text-foreground">{student.latest_score}</span></p>
                  <p>Test: {student.test_title}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="md:col-span-3 text-center text-lg text-muted-foreground py-4">
              No top students to display yet.
            </div>
          )}
        </div>
      </section>

      <MadeWithDyad />
      <BottomNavigationBar />
    </div>
  );
};

export default StudentDashboardPage;