"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Mail, Phone, CalendarDays, GraduationCap, Loader2, Camera, Save, XCircle, Pencil } from "lucide-react";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";
import SignOutButton from "@/components/SignOutButton";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  class: string | null;
  date_of_birth: string | null;
  gender: string | null;
  mobile_number: string | null;
  role: string;
  avatar_url: string | null;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editableProfile, setEditableProfile] = useState<Partial<UserProfile>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const classes = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];
  const genders = ["male", "female", "other"];

  const fetchProfile = useCallback(async () => {
    if (user) {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, class, date_of_birth, gender, mobile_number, role, email, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        showError("Failed to load profile details.");
        setProfile(null);
      } else if (data) {
        setProfile(data as UserProfile);
        setEditableProfile(data as Partial<UserProfile>);
      }
      setLoadingProfile(false);
    } else if (!sessionLoading) {
      navigate("/");
    }
  }, [user, sessionLoading, navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && profile) {
      setEditableProfile(profile);
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEditableProfile((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setEditableProfile((prev) => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setEditableProfile((prev) => ({ ...prev, date_of_birth: date ? format(date, "yyyy-MM-dd") : null }));
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreviewUrl(URL.createObjectURL(file));
    } else {
      setAvatarFile(null);
      setAvatarPreviewUrl(profile?.avatar_url || null);
    }
  };

  const uploadAvatar = async (file: File, userId: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}.${fileExt}`; // Use user ID as file name for uniqueness per user
    const filePath = `${userId}/${fileName}`; // Store in a folder named after the user ID

    // First, try to delete existing avatar for this user
    if (profile?.avatar_url) {
      const oldFilePath = profile.avatar_url.split('/').slice(-2).join('/'); // Get 'userId/fileName.ext'
      await supabase.storage.from('avatars').remove([oldFilePath]);
    }

    const { data, error } = await supabase.storage.from("avatars").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true, // Overwrite if file with same name exists
    });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    if (!user) {
      showError("User not logged in.");
      setIsSaving(false);
      return;
    }

    try {
      let newAvatarUrl = profile?.avatar_url;

      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(avatarFile, user.id);
      } else if (avatarPreviewUrl === null && profile?.avatar_url) {
        // If avatar was removed and there was an old one, delete it from storage
        const oldFilePath = profile.avatar_url.split('/').slice(-2).join('/');
        if (oldFilePath) {
          await supabase.storage.from('avatars').remove([oldFilePath]);
        }
        newAvatarUrl = null;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: editableProfile.first_name,
          last_name: editableProfile.last_name,
          class: editableProfile.class,
          date_of_birth: editableProfile.date_of_birth,
          gender: editableProfile.gender,
          mobile_number: editableProfile.mobile_number,
          avatar_url: newAvatarUrl,
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      showSuccess("Profile updated successfully!");
      await fetchProfile(); // Re-fetch to get the latest data
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error saving profile:", error.message);
      showError(`Failed to update profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (sessionLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <span className="text-lg text-slate-700">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-4xl mb-6">
          <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2 bg-white shadow-md">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
        <Card className="w-full max-w-4xl shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white text-center">
            <User className="h-16 w-16 mx-auto mb-4 bg-white/20 p-3 rounded-full" />
            <CardTitle className="text-3xl font-bold">My Profile</CardTitle>
            <CardDescription className="text-blue-100 mt-2">
              Could not load profile details. Please try again later.
            </CardDescription>
          </div>
          <CardContent className="p-8 text-center">
            <SignOutButton />
          </CardContent>
        </Card>
        <BottomNavigationBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-4xl mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2 bg-white shadow-md hover:shadow-lg transition-shadow">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
        <SignOutButton />
      </div>
      
      <Card className="w-full max-w-4xl shadow-xl rounded-2xl overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={avatarPreviewUrl || profile.avatar_url || undefined} alt="Profile Avatar" />
                  <AvatarFallback className="bg-white text-blue-600 text-4xl font-bold">
                    {profile.first_name ? profile.first_name[0].toUpperCase() : <User className="h-16 w-16" />}
                  </AvatarFallback>
                </Avatar>
              </div>
              {isEditing && (
                <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-white text-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-50 transition-colors shadow-lg">
                  <Camera className="h-5 w-5" />
                  <Input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                </Label>
              )}
            </div>
            <CardTitle className="text-3xl font-bold text-center">
              {profile.first_name} {profile.last_name}
            </CardTitle>
            <CardDescription className="text-blue-100 mt-2 text-center">
              {isEditing ? "Edit your personal information" : "Your personal information"}
            </CardDescription>
          </div>
        </div>
        
        {/* Profile Content */}
        <CardContent className="p-8">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-slate-700 font-medium">First Name</Label>
                <Input id="first_name" value={editableProfile.first_name || ""} onChange={handleInputChange} className="border-slate-300 focus:border-blue-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-slate-700 font-medium">Last Name</Label>
                <Input id="last_name" value={editableProfile.last_name || ""} onChange={handleInputChange} className="border-slate-300 focus:border-blue-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                <Input id="email" type="email" value={editableProfile.email || ""} disabled className="bg-slate-100 border-slate-300 cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile_number" className="text-slate-700 font-medium">Mobile Number</Label>
                <Input id="mobile_number" type="tel" value={editableProfile.mobile_number || ""} onChange={handleInputChange} className="border-slate-300 focus:border-blue-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class" className="text-slate-700 font-medium">Class</Label>
                <Select onValueChange={(value) => handleSelectChange("class", value)} value={editableProfile.class || ""}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500">
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
              <div className="space-y-2">
                <Label htmlFor="date_of_birth" className="text-slate-700 font-medium">Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal border-slate-300 focus:border-blue-500",
                        !editableProfile.date_of_birth && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {editableProfile.date_of_birth ? format(new Date(editableProfile.date_of_birth), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editableProfile.date_of_birth ? new Date(editableProfile.date_of_birth) : undefined}
                      onSelect={handleDateChange}
                      initialFocus
                      captionLayout="dropdown" // Enable year and month dropdowns
                      fromYear={1900} // Start year for selection
                      toYear={new Date().getFullYear()} // End year for selection (current year)
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-slate-700 font-medium">Gender</Label>
                <Select onValueChange={(value) => handleSelectChange("gender", value)} value={editableProfile.gender || ""}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500">
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genders.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-700 font-medium">Role</Label>
                <Input id="role" value={editableProfile.role || ""} disabled className="bg-slate-100 border-slate-300 cursor-not-allowed" />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={handleEditToggle} disabled={isSaving} className="px-6 py-2 border-slate-300 hover:bg-slate-50">
                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={isSaving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-xl p-4 flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="text-lg font-medium text-slate-800">{profile.email}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Mobile Number</p>
                    <p className="text-lg font-medium text-slate-800">{profile.mobile_number || "N/A"}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 flex items-center space-x-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <GraduationCap className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Class</p>
                    <p className="text-lg font-medium text-slate-800">{profile.class || "N/A"}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 flex items-center space-x-4">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <CalendarDays className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Date of Birth</p>
                    <p className="text-lg font-medium text-slate-800">{profile.date_of_birth ? format(new Date(profile.date_of_birth), "PPP") : "N/A"}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 flex items-center space-x-4">
                  <div className="bg-pink-100 p-3 rounded-full">
                    <User className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Gender</p>
                    <p className="text-lg font-medium text-slate-800 capitalize">{profile.gender || "N/A"}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 flex items-center space-x-4">
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Role</p>
                    <p className="text-lg font-medium text-slate-800 capitalize">{profile.role || "N/A"}</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button onClick={handleEditToggle} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  <Pencil className="mr-2 h-5 w-5" /> Edit Profile
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <BottomNavigationBar />
    </div>
  );
};

export default ProfilePage;