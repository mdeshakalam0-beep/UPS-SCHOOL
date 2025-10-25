"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, School, UploadCloud, Save, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/components/SessionContextProvider";
import { showError, showSuccess } from "@/utils/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SchoolSettings {
  id: string;
  school_name: string;
  school_logo_url: string | null;
  updated_at: string;
}

const ManageSchoolSettingsTab = () => {
  const { user } = useSession();
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  const fetchSchoolSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("school_settings")
      .select("*")
      .limit(1) // Assuming only one row for global settings
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
      console.error("Error fetching school settings:", error);
      showError("Failed to load school settings.");
      setSettings(null);
    } else if (data) {
      setSettings(data as SchoolSettings);
      setSchoolName(data.school_name);
      setLogoPreviewUrl(data.school_logo_url);
    } else {
      // No settings found, initialize with default
      setSettings(null);
      setSchoolName("UPS PUBLISH SCHOOL"); // Default name
      setLogoPreviewUrl(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSchoolSettings();
  }, [fetchSchoolSettings]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file));
    } else {
      setLogoFile(null);
      setLogoPreviewUrl(settings?.school_logo_url || null);
    }
  };

  const uploadLogo = async (file: File, existingLogoUrl?: string | null) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `school_logo.${fileExt}`; // Fixed file name for the single logo
    const filePath = `public/${fileName}`;

    // If there's an existing logo, try to delete it first
    if (existingLogoUrl) {
      const oldFileName = existingLogoUrl.split('/').pop();
      if (oldFileName) {
        const { error: deleteError } = await supabase.storage.from('school_logos_bucket').remove([`public/${oldFileName}`]);
        if (deleteError) {
          console.warn("Failed to delete old logo file:", deleteError.message);
          // Don't throw, continue with new upload
        }
      }
    }

    const { data, error } = await supabase.storage.from("school_logos_bucket").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true, // Overwrite if file with same name exists
    });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from("school_logos_bucket").getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const handleSaveSettings = async () => {
    setIsSubmitting(true);
    if (!user) {
      showError("You must be logged in to update school settings.");
      setIsSubmitting(false);
      return;
    }

    try {
      let newLogoUrl = settings?.school_logo_url;

      if (logoFile) {
        newLogoUrl = await uploadLogo(logoFile, settings?.school_logo_url);
      } else if (logoPreviewUrl === null && settings?.school_logo_url) {
        // If logo was removed and there was an old one, delete it from storage
        const oldFileName = settings.school_logo_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage.from('school_logos_bucket').remove([`public/${oldFileName}`]);
        }
        newLogoUrl = null;
      }

      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from("school_settings")
          .update({
            school_name: schoolName,
            school_logo_url: newLogoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", settings.id);

        if (error) {
          throw error;
        }
      } else {
        // Insert new settings (first time setup)
        const { error } = await supabase
          .from("school_settings")
          .insert({
            school_name: schoolName,
            school_logo_url: newLogoUrl,
          });

        if (error) {
          throw error;
        }
      }

      showSuccess("School settings updated successfully!");
      fetchSchoolSettings(); // Re-fetch to get the latest data
    } catch (error: any) {
      console.error("Error saving school settings:", error.message);
      showError(`Failed to update school settings: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading school settings...</span>
      </div>
    );
  }

  return (
    <Card className="w-full shadow-lg rounded-lg p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-primary">Manage School Settings</CardTitle>
        <CardDescription>Update your school's name and logo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Label htmlFor="school-logo" className="text-lg font-semibold">School Logo</Label>
          <div className="relative w-32 h-32 rounded-full border-2 border-primary flex items-center justify-center overflow-hidden">
            <Avatar className="w-full h-full">
              <AvatarImage src={logoPreviewUrl || undefined} alt="School Logo" className="object-cover" />
              <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
                <School className="h-16 w-16" />
              </AvatarFallback>
            </Avatar>
            <Label htmlFor="logo-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
              <UploadCloud className="h-4 w-4" />
              <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoFileChange} className="hidden" />
            </Label>
          </div>
          {logoPreviewUrl && (
            <Button variant="ghost" size="sm" onClick={() => { setLogoFile(null); setLogoPreviewUrl(null); }} className="text-destructive hover:text-destructive/90">
              Remove Logo
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="schoolName">School Name</Label>
          <Input
            id="schoolName"
            type="text"
            placeholder="Enter school name"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            required
          />
        </div>

        <Button onClick={handleSaveSettings} disabled={isSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default ManageSchoolSettingsTab;