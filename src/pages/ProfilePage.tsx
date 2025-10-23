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
      setAvatarPreviewUrl(null);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-background p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="w-full max-w-4xl mb-6">
          <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
        <Card className="w-full max-w-4xl shadow-lg rounded-lg text-center p-8">
          <CardHeader>
            <User className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold text-primary">My Profile</CardTitle>
            <CardDescription className="text-muted-foreground">
              Could not load profile details. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignOutButton />
          </CardContent>
        </Card>
        <BottomNavigationBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="w-full max-w-4xl mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
        <SignOutButton />
      </div>
      <Card className="w-full max-w-4xl shadow-lg rounded-lg p-8">
        <CardHeader className="text-center">
          <div className="relative mx-auto mb-4 w-24 h-24">
            <Avatar className="w-24 h-24 mx-auto">
              <AvatarImage src={avatarPreviewUrl || profile.avatar_url || undefined} alt="Profile Avatar" />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {profile.first_name ? profile.first_name[0].toUpperCase() : <User className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="h-4 w-4" />
                <Input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
              </Label>
            )}
          </div>
          <CardTitle className="text-3xl font-bold text-primary">
            {profile.first_name} {profile.last_name}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isEditing ? "Edit your personal information" : "Your personal information"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" value={editableProfile.first_name || ""} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" value={editableProfile.last_name || ""} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={editableProfile.email || ""} disabled className="bg-gray-100 cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input id="mobile_number" type="tel" value={editableProfile.mobile_number || ""} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select onValueChange={(value) => handleSelectChange("class", value)} value={editableProfile.class || ""}>
                  <SelectTrigger>
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
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
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
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={(value) => handleSelectChange("gender", value)} value={editableProfile.gender || ""}>
                  <SelectTrigger>
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
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={editableProfile.role || ""} disabled className="bg-gray-100 cursor-not-allowed" />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={handleEditToggle} disabled={isSaving}>
                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-2 border rounded-md bg-muted/50">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg text-foreground flex-grow">Email: <span className="font-medium">{profile.email}</span></p>
              </div>
              <div className="flex items-center space-x-3 p-2 border rounded-md bg-muted/50">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg text-foreground flex-grow">Mobile: <span className="font-medium">{profile.mobile_number || "N/A"}</span></p>
              </div>
              <div className="flex items-center space-x-3 p-2 border rounded-md bg-muted/50">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg text-foreground flex-grow">Class: <span className="font-medium">{profile.class || "N/A"}</span></p>
              </div>
              <div className="flex items-center space-x-3 p-2 border rounded-md bg-muted/50">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg text-foreground flex-grow">Date of Birth: <span className="font-medium">{profile.date_of_birth ? format(new Date(profile.date_of_birth), "PPP") : "N/A"}</span></p>
              </div>
              <div className="flex items-center space-x-3 p-2 border rounded-md bg-muted/50">
                <User className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg text-foreground flex-grow">Gender: <span className="font-medium capitalize">{profile.gender || "N/A"}</span></p>
              </div>
              <div className="flex items-center space-x-3 p-2 border rounded-md bg-muted/50">
                <User className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg text-foreground flex-grow">Role: <span className="font-medium capitalize">{profile.role || "N/A"}</span></p>
              </div>
              <div className="md:col-span-2 mt-4">
                <Button onClick={handleEditToggle} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Pencil className="mr-2 h-4 w-4" /> Edit Profile
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