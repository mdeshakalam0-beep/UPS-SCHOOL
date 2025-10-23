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
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/components/SessionContextProvider"; // Import useSession

const LoginPage = () => {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession(); // Get session and loading state
  const [activeTab, setActiveTab] = useState("login"); // Changed default tab to login
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
        let userRole = null;
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, first_name, last_name') // Also fetch first_name and last_name for fallback
          .eq('id', session.user.id)
          .single();

        if (error) {
          // If profile is null or error indicates no rows found, attempt to create a basic profile
          // Supabase's single() returns error when no rows are found.
          console.warn("User profile not found or error fetching profile:", error);
          
          // Attempt to create a basic profile for the user
          const { data: newUserProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              first_name: session.user.user_metadata?.first_name || 'New',
              last_name: session.user.user_metadata?.last_name || 'User',
              role: 'student', // Default role
              mobile_number: session.user.user_metadata?.mobile_number || null,
              class: session.user.user_metadata?.class || null,
              date_of_birth: session.user.user_metadata?.date_of_birth || null,
              gender: session.user.user_metadata?.gender || null,
            })
            .select('role')
            .single();

          if (insertError) {
            console.error("Error creating fallback profile:", insertError);
            showError("Failed to create user profile. Please contact support.");
            await supabase.auth.signOut();
            navigate("/");
            return;
          }
          userRole = newUserProfile?.role;
          showSuccess("Basic profile created. Please update your details.");
        } else {
          userRole = profile?.role;
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // If session exists and not loading, the useEffect will handle redirection,
  // so we don't render the login form.
  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Redirecting...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">UPS PUBLISH SCHOOL</CardTitle>
          <CardDescription className="text-muted-foreground">Login or Sign Up to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0 space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Login
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0 space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    placeholder="123-456-7890"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signupEmail">Email</Label>
                  <Input
                    id="signupEmail"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signupPassword">Password</Label>
                  <Input
                    id="signupPassword"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="class">Class</Label>
                  <Select onValueChange={setSelectedClass} value={selectedClass} required>
                    <SelectTrigger className="w-full mt-1">
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
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Gender</Label>
                  <RadioGroup onValueChange={setGender} value={gender} className="flex space-x-4 mt-1" required>
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
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign Up
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;