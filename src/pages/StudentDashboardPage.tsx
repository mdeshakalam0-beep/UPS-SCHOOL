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
        submitted_at,
        objective_tests (title),
        profiles (first_name, last_name, avatar_url, class)
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error("Error fetching top students:", error);
      showError("Failed to load top students.");
      setTopStudents([]);
    } else {
      const latestScoresByUser: { [userId: string]: TopStudent } = {};
      data.forEach((result: any) => {
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

      const sortedTopStudents = Object.values(latestScoresByUser)
        .sort((a, b) => b.latest_score - a.latest_score)
        .slice(0, 3);

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
                  className="flex flex-col items-center justify-center p-4 h-auto text-center space-y-2 bg-white shadow-md hover:shadow-lg border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 rounded-xl"
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

      {/* Top 3 Students Section */}
      <section className="mb-8">
        <Card className="w-full max-w-4xl mx-auto shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-center">
              <Trophy className="h-8 w-8 mr-2" />
              <h2 className="text-2xl font-bold">Top 3 Students</h2>
            </div>
          </div>
          <CardContent className="p-6">
            {loadingTopStudents ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-500">Loading top students...</span>
              </div>
            ) : topStudents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topStudents.map((student, index) => (
                  <Card key={student.id} className="shadow-lg bg-white rounded-xl overflow-hidden border-0">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                      <div className="relative mx-auto mb-4 w-24 h-24">
                        <Avatar className="w-24 h-24 mx-auto border-4 border-white shadow-lg">
                          <AvatarImage src={student.avatar_url || undefined} alt={`${student.first_name} Avatar`} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold">
                            {student.first_name ? student.first_name[0].toUpperCase() : <UserIcon className="h-12 w-12" />}
                          </AvatarFallback>
                        </Avatar>
                        <Badge className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' : 
                          'bg-gradient-to-r from-orange-400 to-orange-500'
                        }`}>
                          {index === 0 ? <Trophy className="h-3 w-3 mr-1" /> : <Star className="h-3 w-3 mr-1" />}
                          #{index + 1}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-semibold text-slate-800 text-center">
                        {student.first_name} {student.last_name}
                      </CardTitle>
                    </div>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Class:</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {student.class || "N/A"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Score:</span>
                          <span className="font-bold text-blue-600">{student.latest_score}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Test:</span>
                          <span className="text-sm font-medium text-slate-800 truncate max-w-[120px]">{student.test_title}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-lg text-slate-600">No top students to display yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <MadeWithDyad />
      <BottomNavigationBar />
    </div>
  );
};

export default StudentDashboardPage;