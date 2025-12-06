import React, { useState, useEffect } from 'react';
import { X, Camera, User } from 'lucide-react';
import { usersAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const EditProfileModal = ({ open, onOpenChange, onProfileUpdated }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    bio: '',
    avatar: ''
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(null);

  useEffect(() => {
    if (user && open) {
      setFormData({
        username: user.username || '',
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      });
      setPreviewAvatar(null);
    }
  }, [user, open]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const response = await usersAPI.uploadAvatar(file);
      setFormData({ ...formData, avatar: response.data.url });
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload avatar');
      setPreviewAvatar(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate username
    if (!formData.username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    if (formData.username.trim().length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (formData.username.trim().length > 30) {
      toast.error('Username must be less than 30 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }

    setSaving(true);
    try {
      const response = await usersAPI.updateProfile({
        username: formData.username.trim(),
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        avatar: formData.avatar
      });

      // Update auth context with new user data
      updateUser(response.data);
      
      toast.success('Profile updated successfully!');
      onOpenChange(false);
      
      // Refresh profile if callback provided
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl = previewAvatar || formData.avatar || `https://ui-avatars.com/api/?name=${formData.username}&background=random&size=128`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-border">
                <AvatarImage src={avatarUrl} className="object-cover" />
                <AvatarFallback>
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>
            <p className="text-sm text-muted-foreground">Click camera icon to upload profile picture</p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="your_username"
              maxLength={30}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.username.length}/30 characters
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {formData.name.length}/50 characters
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={160}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.bio.length}/160 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={saving || uploading}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;