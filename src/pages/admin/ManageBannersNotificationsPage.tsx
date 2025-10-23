"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { Image, BellRing, Pencil, Trash2, PlusCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Banner {
  id: string;
  title: string;
  description: string;
  // For now, image will be stored as a File object in state,
  // but for persistence, this would be a URL from Supabase Storage.
  image: File | null;
  imageUrlDisplay: string; // To display the image file name or URL if already uploaded
  isActive: boolean;
}

// Mock data for banners. In a real app, 'image' would be a URL from storage.
const mockBanners: Banner[] = [
  { id: "b1", title: "Welcome to UPS Publish School", description: "Your journey to knowledge starts here!", image: null, imageUrlDisplay: "banner1.jpg", isActive: true },
  { id: "b2", title: "New Courses Available", description: "Explore our exciting new offerings.", image: null, imageUrlDisplay: "banner2.png", isActive: true },
];

const ManageBannersNotificationsPage = () => {
  const [banners, setBanners] = useState<Banner[]>(mockBanners);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [newBannerData, setNewBannerData] = useState<Omit<Banner, "id">>({
    title: "",
    description: "",
    image: null,
    imageUrlDisplay: "",
    isActive: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, files, type, checked } = e.target;
    if (id === "image" && files && files.length > 0) {
      setNewBannerData((prev) => ({ ...prev, image: files[0], imageUrlDisplay: files[0].name }));
    } else if (type === "checkbox") {
      setNewBannerData((prev) => ({ ...prev, [id]: checked }));
    } else {
      setNewBannerData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleAddBanner = () => {
    if (!newBannerData.title || !newBannerData.image) {
      showError("Please fill in the banner title and upload an image.");
      return;
    }
    // In a real app with Supabase, you would upload newBannerData.image here
    // and get an imageUrl back to store in the database.
    const newBanner: Banner = {
      ...newBannerData,
      id: String(banners.length + 1), // Simple ID generation
      imageUrlDisplay: newBannerData.image?.name || "", // Display image file name
    };
    setBanners((prev) => [...prev, newBanner]);
    showSuccess("Banner added successfully! (Image not actually uploaded to server yet)");
    setNewBannerData({ title: "", description: "", image: null, imageUrlDisplay: "", isActive: true });
    setIsDialogOpen(false);
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setNewBannerData({ ...banner, image: null }); // Don't pre-fill image input, user must re-upload if changing
    setIsDialogOpen(true);
  };

  const handleUpdateBanner = () => {
    if (!editingBanner || !newBannerData.title) {
      showError("Please fill in the banner title.");
      return;
    }
    // If newBannerData.image exists, it means a new image was selected and needs to be uploaded.
    // Otherwise, keep the existing imageUrlDisplay.
    const updatedImageUrlDisplay = newBannerData.image ? newBannerData.image.name : editingBanner.imageUrlDisplay;

    setBanners((prev) =>
      prev.map((b) =>
        b.id === editingBanner.id
          ? { ...newBannerData, id: editingBanner.id, image: newBannerData.image, imageUrlDisplay: updatedImageUrlDisplay }
          : b
      )
    );
    showSuccess("Banner updated successfully! (Image not actually uploaded to server yet)");
    setEditingBanner(null);
    setNewBannerData({ title: "", description: "", image: null, imageUrlDisplay: "", isActive: true });
    setIsDialogOpen(false);
  };

  const handleDeleteBanner = (id: string) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      setBanners((prev) => prev.filter((b) => b.id !== id));
      showSuccess("Banner deleted successfully!");
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingBanner(null);
    setNewBannerData({ title: "", description: "", image: null, imageUrlDisplay: "", isActive: true });
  };

  return (
    <Card className="w-full shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-primary">Manage Banners & Notifications</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingBanner(null); setNewBannerData({ title: "", description: "", image: null, imageUrlDisplay: "", isActive: true }); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
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
                <Label htmlFor="image" className="text-right">
                  Upload Image
                </Label>
                <Input id="image" type="file" accept="image/*" onChange={handleInputChange} className="col-span-3" />
                {newBannerData.imageUrlDisplay && (
                  <div className="col-span-4 text-sm text-muted-foreground text-right">
                    Current: {newBannerData.imageUrlDisplay}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="text-right">
                  Active
                </Label>
                <input
                  id="isActive"
                  type="checkbox"
                  checked={newBannerData.isActive}
                  onChange={handleInputChange}
                  className="col-span-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
              <Button onClick={editingBanner ? handleUpdateBanner : handleAddBanner} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {editingBanner ? "Save Changes" : "Add Banner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
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
            {banners.map((banner) => (
              <TableRow key={banner.id}>
                <TableCell className="font-medium">{banner.title}</TableCell>
                <TableCell>{banner.description}</TableCell>
                <TableCell>
                  {/* In a real app, this would display the image from its URL */}
                  {banner.imageUrlDisplay || "No image"}
                </TableCell>
                <TableCell>{banner.isActive ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEditBanner(banner)} className="mr-2">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteBanner(banner.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {banners.length === 0 && (
          <p className="text-center text-muted-foreground mt-4">No banners found. Add a new banner to get started!</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageBannersNotificationsPage;