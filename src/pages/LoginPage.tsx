"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, BookOpen, User, Mail, Lock, Phone, Calendar, UserPlus, LogIn } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/components/SessionContextProvider";

const LoginPage = () => {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signup specific states
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    const handleRedirect = async () => {
      if (!sessionLoading && session) {
        let userRole = 'student'; // Default to student if profile fetch fails or is not found
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found" for single()
          console.error("Error fetching user profile:", error);
          showError("Failed to fetch user profile. Please try again.");
          // Do not sign out here, let them proceed to a default dashboard
          // The dashboard can then prompt them to complete their profile.
        } else if (profile) {
          userRole = profile.role;
        } else {
          // Profile not found (PGRST116 error or data is null), assume new user, default to student role.
          // The handle_new_user trigger should have created it.
          // If it didn't, the user will land on student dashboard and can update profile.
          console.warn("User profile not found after login. Defaulting to student role.");
          showSuccess("Welcome! Please complete your profile details.");
        }

        if (userRole === 'admin') {
          navigate("/admin-dashboard");
        } else {
          navigate("/student-dashboard");
        }
      }
    };
    handleRedirect();
  }, [session, sessionLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showError(error.message);
      } else {
        showSuccess("Login successful!");
        // Redirection will be handled by the useEffect in SessionContextProvider
        // or the local useEffect after session is established.
      }
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!fullName || !mobileNumber || !email || !password || !selectedClass || !dateOfBirth || !gender) {
      showError("Please fill in all required fields for signup.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: fullName.split(' ')[0] || '',
            last_name: fullName.split(' ').slice(1).join(' ') || '',
            mobile_number: mobileNumber,
            class: selectedClass,
            date_of_birth: dateOfBirth.toISOString().split('T')[0], // Format to YYYY-MM-DD
            gender: gender,
            // Role is set to 'student' by the handle_new_user trigger
          },
        },
      });

      if (error) {
        showError(error.message);
      } else {
        showSuccess("Signup successful! Please check your email to confirm your account.");
        setEmail("");
        setPassword("");
        setFullName("");
        setMobileNumber("");
        setSelectedClass("");
        setDateOfBirth(undefined);
        setGender("");
        setActiveTab("login"); // Switch back to login tab
      }
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const classes = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <span className="text-lg text-slate-700">Loading...</span>
        </div>
      </div>
    );
  }

  // If session exists and not loading, the useEffect will handle redirection,
  // so we don't render the login form.
  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <span className="text-lg text-slate-700">Redirecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">UPS PUBLISH SCHOOL</h1>
          <p className="text-slate-600 mt-2">Login or Sign Up to your account</p>
        </div>
        
        <Card className="shadow-xl rounded-2xl overflow-hidden border-0">
          <CardContent className="p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger 
                  value="login" 
                  className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all"
                >
                  <LogIn className="h-4 w-4 mr-2" /> Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all"
                >
                  <UserPlus className="h-4 w-4 mr-2" /> Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 border-slate-300 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 border-slate-300 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                    Login
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div>
                    <Label htmlFor="fullName" className="text-slate-700 font-medium">Full Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 border-slate-300 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="mobileNumber" className="text-slate-700 font-medium">Mobile Number</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="mobileNumber"
                        type="tel"
                        placeholder="123-456-7890"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="pl-10 border-slate-300 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signupEmail" className="text-slate-700 font-medium">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="signupEmail"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 border-slate-300 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signupPassword" className="text-slate-700 font-medium">Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="signupPassword"
                        type="password"
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 border-slate-300 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="class" className="text-slate-700 font-medium">Class</Label>
                    <Select onValueChange={setSelectedClass} value={selectedClass} required>
                      <SelectTrigger className="w-full mt-1 border-slate-300 focus:border-blue-500">
                        <SelectValue placeholder="Select your class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth" className="text-slate-700 font-medium">Date of Birth</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1 border-slate-300 focus:border-blue-500",
                            !dateOfBirth && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateOfBirth}
                          onSelect={setDateOfBirth}
                          initialFocus
                          captionLayout="dropdown" // Enable year and month dropdowns
                          fromYear={1900} // Start year for selection
                          toYear={new Date().getFullYear()} // End year for selection (current year)
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-slate-700 font-medium">Gender</Label>
                    <RadioGroup onValueChange={setGender} value={gender} className="flex space-x-4 mt-2" required>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female">Female</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other">Other</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Sign Up
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;