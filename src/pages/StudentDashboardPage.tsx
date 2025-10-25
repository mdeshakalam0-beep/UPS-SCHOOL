"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import Header from "@/components/Header";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, MonitorPlay, ClipboardCheck, FileText, Award, Book, MessageSquare, Loader2, User as UserIcon, Star, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import Autoplay from "embla-carousel-autoplay";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Banner {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  is_active: boolean;
}

interface TopStudent {
  id: string;
  first_name: string;
  last_name: string | null;
  class: string | null;
  avatar_url: string | null;
  latest_score: number;
  test_title: string;
  time_taken_seconds: number | null; // Added time taken
  submitted_at: string;
}

const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [loadingTopStudents, setLoadingTopStudents] = useState(true);

  const quickAccessItems = [
    { name: "Recorded Class", icon: Video, path: "/recorded-class" },
    { name: "Live Class", icon: MonitorPlay, path: "/live-class" },
    { name: "Objective Test", icon: ClipboardCheck, path: "/objective-test" },
    { name: "Subjective Test", icon: FileText, path: "/subjective-test" },
    { name: "Results", icon: Award, path: "/results" },
    { name: "Notes/PDF", icon: Book, path: "/notes-pdf" },
    { name: "Dobit Box", icon: MessageSquare, path: "/dobit-box" },
  ];

  const formatTimeTaken = (totalSeconds: number | null) => {
    if (totalSeconds === null || totalSeconds < 0) return "N/A";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

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
    const { data, error } = await supabase
      .from('student_objective_results')
      .select(`
        user_id,
        score,
        started_at,
        submitted_at,
        objective_tests (title),
        profiles (first_name, last_name, avatar_url, class)
      `)
      .order('submitted_at', { ascending: false }); // Order by submitted_at to get latest attempts

    if (error) {
      console.error("Error fetching top students:", error);
      showError("Failed to load top students.");
      setTopStudents([]);
    } else {
      const latestScoresByUser: { [userId: string]: TopStudent } = {};
      data.forEach((result: any) => {
        const startedAt = result.started_at ? new Date(result.started_at) : null;
        const submittedAt = new Date(result.submitted_at);
        const timeTakenSeconds = startedAt ? Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000) : null;

        // Only consider results where time taken is recorded and positive
        if (timeTakenSeconds !== null && timeTakenSeconds >= 0) {
          // If no entry for this user yet, or if this attempt is better
          if (!latestScoresByUser[result.user_id]) {
            latestScoresByUser[result.user_id] = {
              id: result.user_id,
              first_name: result.profiles?.first_name || 'Unknown',
              last_name: result.profiles?.last_name,
              class: result.profiles?.class,
              avatar_url: result.profiles?.avatar_url,
              latest_score: result.score,
              test_title: result.objective_tests?.title || 'N/A',
              time_taken_seconds: timeTakenSeconds,
              submitted_at: result.submitted_at,
            };
          } else {
            const existing = latestScoresByUser[result.user_id];
            // Prioritize less time, then higher score
            if (timeTakenSeconds < existing.time_taken_seconds!) {
              latestScoresByUser[result.user_id] = {
                id: result.user_id,
                first_name: result.profiles?.first_name || 'Unknown',
                last_name: result.profiles?.last_name,
                class: result.profiles?.class,
                avatar_url: result.profiles?.avatar_url,
                latest_score: result.score,
                test_title: result.objective_tests?.title || 'N/A',
                time_taken_seconds: timeTakenSeconds,
                submitted_at: result.submitted_at,
              };
            } else if (timeTakenSeconds === existing.time_taken_seconds && result.score > existing.latest_score) {
              latestScoresByUser[result.user_id] = {
                id: result.user_id,
                first_name: result.profiles?.first_name || 'Unknown',
                last_name: result.profiles?.last_name,
                class: result.profiles?.class,
                avatar_url: result.profiles?.avatar_url,
                latest_score: result.score,
                test_title: result.objective_tests?.title || 'N/A',
                time_taken_seconds: timeTakenSeconds,
                submitted_at: result.submitted_at,
              };
            }
          }
        }
      });

      const sortedTopStudents = Object.values(latestScoresByUser)
        .sort((a, b) => {
          // Primary sort: least time taken (ascending)
          if (a.time_taken_seconds !== null && b.time_taken_seconds !== null) {
            if (a.time_taken_seconds !== b.time_taken_seconds) {
              return a.time_taken_seconds - b.time_taken_seconds;
            }
          }
          // Secondary sort: higher score if time is equal or one has no time recorded
          return b.latest_score - a.latest_score;
        })
        .slice(0, 3); // Get top 3

      setTopStudents(sortedTopStudents);
    }
    setLoadingTopStudents(false);
  }, []);

  useEffect(() => {
    fetchActiveBanners();
    fetchTopStudents();

    const resultsChannel = supabase
      .channel('top_students_results_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_objective_results' },
        (payload) => {
          console.log('Realtime change in student_objective_results:', payload);
          fetchTopStudents();
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('top_students_profiles_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Realtime change in profiles:', payload);
          fetchTopStudents();
        }
      )
      .subscribe();

    return () => {
      resultsChannel.unsubscribe();
      profilesChannel.unsubscribe();
    };
  }, [fetchActiveBanners, fetchTopStudents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <Header />

      {/* Hero Banner (Auto Slider) */}
      <section className="mb-8">
        {loadingBanners ? (
          <div className="flex justify-center items-center h-48 bg-white rounded-xl shadow-lg border border-slate-200">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-slate-500">Loading banners...</span>
          </div>
        ) : banners.length > 0 ? (
          <Carousel
            plugins={[
              Autoplay({
                delay: 4000,
                stopOnInteraction: false,
              }),
            ]}
            className="w-full max-w-4xl mx-auto"
          >
            <CarouselContent>
              {banners.map((banner) => (
                <CarouselItem key={banner.id}>
                  <div className="p-1">
                    <Card className="overflow-hidden rounded-xl shadow-xl border-0">
                      <img src={banner.image_url} alt={banner.title} className="w-full h-48 object-cover" />
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="bg-white/80 hover:bg-white text-slate-700 border-slate-200" />
            <CarouselNext className="bg-white/80 hover:bg-white text-slate-700 border-slate-200" />
          </Carousel>
        ) : (
          <div className="flex justify-center items-center h-48 bg-white rounded-xl shadow-lg border border-slate-200">
            <p className="text-slate-500">No active banners available.</p>
          </div>
        )}
      </section>

      {/* CLASS TOPPER Section - Moved here and made smaller/carousel */}
      <section className="mb-8">
        <Card className="w-full max-w-4xl mx-auto shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white"> {/* Reduced padding */}
            <div className="flex items-center justify-center">
              <Trophy className="h-6 w-6 mr-2" /> {/* Smaller icon */}
              <h2 className="text-xl font-bold">CLASS TOPPER</h2> {/* Changed title */}
            </div>
          </div>
          <CardContent className="p-4"> {/* Reduced padding */}
            {loadingTopStudents ? (
              <div className="flex justify-center items-center h-32"> {/* Reduced height */}
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" /> {/* Smaller loader */}
                <span className="ml-2 text-sm text-slate-500">Loading class toppers...</span> {/* Smaller text */}
              </div>
            ) : topStudents.length > 0 ? (
              <Carousel
                plugins={[
                  Autoplay({
                    delay: 3000, // 3 seconds
                    stopOnInteraction: false,
                  }),
                ]}
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2"> {/* Adjusted margin */}
                  {topStudents.map((student, index) => (
                    <CarouselItem key={student.id} className="pl-2 md:basis-1/2 lg:basis-1/3"> {/* Adjusted basis */}
                      <div className="p-1">
                        <Card className="shadow-lg bg-white rounded-xl overflow-hidden border-0">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3"> {/* Reduced padding */}
                            <div className="relative mx-auto mb-2 w-20 h-20"> {/* Smaller avatar container */}
                              <Avatar className="w-20 h-20 mx-auto border-3 border-white shadow-lg"> {/* Smaller avatar */}
                                <AvatarImage src={student.avatar_url || undefined} alt={`${student.first_name} Avatar`} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold"> {/* Smaller text */}
                                  {student.first_name ? student.first_name[0].toUpperCase() : <UserIcon className="h-10 w-10" />} {/* Smaller icon */}
                                </AvatarFallback>
                              </Avatar>
                              <Badge className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md ${ /* Smaller badge */
                                index === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 
                                index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' : 
                                'bg-gradient-to-r from-orange-400 to-orange-500'
                              }`}>
                                {index === 0 ? <Trophy className="h-3 w-3 mr-1" /> : <Star className="h-3 w-3 mr-1" />}
                                #{index + 1}
                              </Badge>
                            </div>
                            <CardTitle className="text-base font-semibold text-slate-800 text-center"> {/* Smaller title */}
                              {student.first_name} {student.last_name}
                            </CardTitle>
                          </div>
                          <CardContent className="pt-3 pb-2 px-3"> {/* Reduced padding */}
                            <div className="space-y-1"> {/* Reduced space */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-600">Class:</span> {/* Smaller text */}
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs"> {/* Smaller badge text */}
                                  {student.class || "N/A"}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-600">Score:</span> {/* Smaller text */}
                                <span className="font-bold text-blue-600 text-sm">{student.latest_score}</span> {/* Smaller text */}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-600">Time:</span> {/* New line for time */}
                                <span className="text-xs font-medium text-slate-800">{formatTimeTaken(student.time_taken_seconds)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-600">Test:</span> {/* Smaller text */}
                                <span className="text-xs font-medium text-slate-800 truncate max-w-[80px]">{student.test_title}</span> {/* Smaller text */}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" /> {/* Adjusted position */}
                <CarouselNext className="right-2" /> {/* Adjusted position */}
              </Carousel>
            ) : (
              <div className="text-center py-8"> {/* Reduced padding */}
                <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-3" /> {/* Smaller icon */}
                <p className="text-base text-slate-600">No class toppers to display yet.</p> {/* Smaller text */}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Quick Access Buttons */}
      <section className="mb-8">
        <Card className="w-full max-w-4xl mx-auto shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <h2 className="text-2xl font-bold text-center">Quick Access</h2>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {quickAccessItems.map((item) => (
                <Button
                  key={item.name}
                  variant="outline"
                  className="flex flex-col items-center justify-center p-3 h-auto text-center space-y-2 bg-white shadow-md hover:shadow-lg border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 rounded-xl"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-8 w-8 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">{item.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <MadeWithDyad />
      <BottomNavigationBar />
    </div>
  );
};

export default StudentDashboardPage;