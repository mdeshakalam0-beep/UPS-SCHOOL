"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import Header from "@/components/Header";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, MonitorPlay, ClipboardCheck, FileText, Award, Book, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavigationBar from "@/components/BottomNavigationBar"; // Import BottomNavigationBar

const StudentDashboardPage = () => {
  const navigate = useNavigate();

  const quickAccessItems = [
    { name: "Recorded Class", icon: Video, path: "/recorded-class" },
    { name: "Live Class", icon: MonitorPlay, path: "/live-class" },
    { name: "Objective Test", icon: ClipboardCheck, path: "/objective-test" },
    { name: "Subjective Test", icon: FileText, path: "/subjective-test" },
    { name: "Results", icon: Award, path: "/results" },
    { name: "Notes/PDF", icon: Book, path: "/notes-pdf" },
    { name: "Dobit Box", icon: MessageSquare, path: "/dobit-box" },
  ];

  // Placeholder for banner images - using local paths now
  const bannerImages = [
    "/banner1.png",
    "/banner2.png",
    "/banner3.png",
  ];

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 pb-20 md:pb-8"> {/* Added padding-bottom to account for fixed bottom nav */}
      <Header />

      {/* Removed Sign Out Button for Students from here */}
      {/* <div className="flex justify-end mb-4 max-w-4xl mx-auto">
        <SignOutButton />
      </div> */}

      {/* Hero Banner (Auto Slider) */}
      <section className="mb-8">
        <Carousel className="w-full max-w-4xl mx-auto">
          <CarouselContent>
            {bannerImages.map((src, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card className="overflow-hidden rounded-lg shadow-md">
                    <img src={src} alt={`Banner ${index + 1}`} className="w-full h-48 object-cover rounded-lg" />
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
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
          {/* Placeholder cards for top students */}
          {[1, 2, 3].map((num) => (
            <Card key={num} className="shadow-md rounded-lg">
              <CardHeader>
                <CardTitle className="text-lg">Student {num}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Name: John Doe</p>
                <p className="text-muted-foreground">Class: 10th</p>
                <p className="text-muted-foreground">Time: 15:30</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <MadeWithDyad />
      <BottomNavigationBar /> {/* Add the bottom navigation bar here */}
    </div>
  );
};

export default StudentDashboardPage;