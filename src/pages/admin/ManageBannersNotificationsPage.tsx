"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { Image, BellRing, Pencil, Trash2, PlusCircle, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/components/SessionContextProvider";

interface Banner {
  id: string;
  title: string;
  description: string | null;
  image_url: string; // This will now be the URL from Supabase Storage
  is_active: boolean;
}

const ManageBannersNotificationsPage = () => {
  const { user } = useSession();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [newBannerData, setNewBannerData] = useState<{
    title: string;
    description: string;
    imageFile: File | null; // For new image upload
    is_active: boolean;
  }>({
    title: "",
    description: "",
    imageFile: null,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching banners:", error);
      showError("Failed to load banners.");
    } else {
      setBanners(data as Banner[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, files, type, checked } = e.target;
    if (id === "imageFile" && files && files.length > 0) {
      setNewBannerData((prev) => ({ ...prev, imageFile: files[0] }));
    } else if (type === "checkbox") {
      setNewBannerData((prev) => ({ ...prev, [id]: checked }));
    } else {
      setNewBannerData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const uploadImage = async (file: File, existingImageUrl?: string | null) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `public/${fileName}`; // Store in a 'public' folder within the bucket

    // If there's an existing image, try to delete it first
    if (existingImageUrl) {
      const oldFileName = existingImageUrl.split('/').pop();
      if (oldFileName) {
        const { error: deleteError } = await supabase.storage.from('banners_bucket').remove([`public/${oldFileName}`]);
        if (deleteError) {
          console.warn("Failed to delete old banner image:", deleteError.message);
          // Don't throw, continue with new upload
        }
      }
    }

    const { data, error } = await supabase.storage.from("banners_bucket").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false, // Do not upsert, create new file
    });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from("banners_bucket").getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const handleAddBanner = async () => {
    setIsSubmitting(true);
    if (!newBannerData.title || !newBannerData.imageFile) {
      showError("Please fill in the banner title and upload an image.");
      setIsSubmitting(false);
      return;
    }
    if (!user) {
      showError("You must be logged in to add a banner.");
      setIsSubmitting(false);
      return;
    }

    try {
      const imageUrl = await uploadImage(newBannerData.imageFile);

      const { error } = await supabase.from("banners").insert({
        title: newBannerData.title,
        description: newBannerData.description,
        image_url: imageUrl,
        is_active: newBannerData.is_active,
      });

      if (error) {
        throw error;
      }

      showSuccess("Banner added successfully!");
      fetchBanners();
      handleDialogClose();
    } catch (error: any) {
      console.error("Error adding banner:", error.message);
      showError(`Failed to add banner: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setNewBannerData({
      title: banner.title,
      description: banner.description || "",
      imageFile: null, // User must re-upload if changing image
      is_active: banner.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleUpdateBanner = async () => {
    setIsSubmitting(true);
    if (!editingBanner || !newBannerData.title) {
      showError("Please fill in the banner title.");
      setIsSubmitting(false);
      return;
    }

    try {
      let imageUrl = editingBanner.image_url;
      if (newBannerData.imageFile) {
        // Upload new image and get its URL, deleting the old one
        imageUrl = await uploadImage(newBannerData.imageFile, editingBanner.image_url);
      }

      const { error } = await supabase
        .from("banners")
        .update({
          title: newBannerData.title,
          description: newBannerData.description,
          image_url: imageUrl,
          is_active: newBannerData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingBanner.id);

      if (error) {
        throw error;
      }

      showSuccess("Banner updated successfully!");
      fetchBanners();
      handleDialogClose();
    } catch (error: any) {
      console.error("Error updating banner:", error.message);
      showError(`Failed to update banner: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBanner = async (banner: Banner) => {
    if (!window.confirm("Are you sure you want to delete this banner? This will also delete its image.")) {
      return;
    }

    try {
      // Delete image from Supabase Storage
      const fileName = banner.image_url.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage.from("banners_bucket").remove([`public/${fileName}`]);
        if (storageError) {
          console.warn("Error deleting banner image from storage:", storageError.message);
          // Don't throw, try to delete the database record anyway
        }
      }

      // Delete record from Supabase database
      const { error: dbError } = await supabase.from("banners").delete().eq("id", banner.id);

      if (dbError) {
        throw dbError;
      }

      showSuccess("Banner deleted successfully!");
      fetchBanners();
    } catch (error: any) {
      console.error("Error deleting banner:", error.message);
      showError(`Failed to delete banner: ${error.message}`);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingBanner(null);
    setNewBannerData({ title: "", description: "", imageFile: null, is_active: true });
  };

  return (
    <Card className="w-full shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-primary">Manage Banners & Notifications</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingBanner(null); setNewBannerData({ title: "", description: "", imageFile: null, is_active: true }); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingBanner ? "Edit Banner" : "Add New Banner"}</DialogTitle>
              <CardDescription>{editingBanner ? "Update banner details." : "Enter new banner information."}</CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input id="title" value={newBannerData.title} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea id="description" value={newBannerData.description} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imageFile" className="text-right">
                  Upload Image
                </Label>
                <Input id="imageFile" type="file" accept="image/*" onChange={handleInputChange} className="col-span-3" />
                {editingBanner?.image_url && !newBannerData.imageFile && (
                  <div className="col-span-4 text-sm text-muted-foreground text-right">
                    Current: <a href={editingBanner.image_url} target="_blank" rel="noopener noreferrer" className="underline">{editingBanner.image_url.split('/').pop()}</a>
                  </div>
                )}
                {newBannerData.imageFile && (
                  <div className="col-span-4 text-sm text-muted-foreground text-right">
                    Selected: {newBannerData.imageFile.name}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_active" className="text-right">
                  Active
                </Label>
                <input
                  id="is_active"
                  type="checkbox"
                  checked={newBannerData.is_active}
                  onChange={handleInputChange}
                  className="col-span-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={editingBanner ? handleUpdateBanner : handleAddBanner} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingBanner ? "Save Changes" : "Add Banner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading banners...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.length > 0 ? (
                banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell className="font-medium">{banner.title}</TableCell>
                    <TableCell>{banner.description}</TableCell>
                    <TableCell>
                      <a href={banner.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {banner.image_url.split('/').pop()}
                      </a>
                    </TableCell>
                    <TableCell>{banner.is_active ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditBanner(banner)} className="mr-2">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteBanner(banner)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                    No banners found. Add a new banner to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageBannersNotificationsPage;