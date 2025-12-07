import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Image, Video, X, Tag as TagIcon, Globe, Users, Edit, Crop } from 'lucide-react';
import { postsAPI, usersAPI, collaborationsAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import MentionAutocomplete from './MentionAutocomplete';
import ImageTagging from './ImageTagging';
import CollaboratorSelector from './CollaboratorSelector';
import ImageCropModal from './ImageCropModal';
import LazyImage from '../ui/lazy-image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [imageTags, setImageTags] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState('public');
  
  // Collaborator state
  const [collaborator, setCollaborator] = useState(null);
  const [collaboratorDialogOpen, setCollaboratorDialogOpen] = useState(false);
  
  // Mention autocomplete state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionSearchActive, setMentionSearchActive] = useState(false);
  
  // Image tagging state
  const [tagImageIndex, setTagImageIndex] = useState(null);
  
  // Image cropping state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentCropImage, setCurrentCropImage] = useState(null);
  const [currentCropIndex, setCurrentCropIndex] = useState(null);
  
  const textareaRef = useRef(null);
  const searchTimeout = useRef(null);

  // Handle mention search
  useEffect(() => {
    if (mentionQuery.length > 0) {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      searchTimeout.current = setTimeout(async () => {
        try {
          const response = await usersAPI.search(mentionQuery);
          setMentionSuggestions(response.data.slice(0, 5));
          setSelectedMentionIndex(0);
        } catch (error) {
          console.error('Search error:', error);
        }
      }, 300);
    } else {
      setMentionSuggestions([]);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [mentionQuery]);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = newText.substring(0, cursorPos);
    
    // Check if we're typing a mention
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setShowMentions(true);
      setMentionSearchActive(true);
      
      // Calculate position for dropdown
      const rect = textarea.getBoundingClientRect();
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines.length - 1;
      const lineHeight = 24; // Approximate line height
      
      setMentionPosition({
        top: rect.top + (currentLine * lineHeight) + lineHeight + 5,
        left: rect.left + 10
      });
    } else {
      setShowMentions(false);
      setMentionSearchActive(false);
    }
  };

  const handleMentionSelect = (selectedUser) => {
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    const textAfterCursor = text.substring(cursorPos);
    
    // Find the @ symbol position
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const beforeMention = text.substring(0, atIndex);
    
    const newText = `${beforeMention}@${selectedUser.username} ${textAfterCursor}`;
    setText(newText);
    
    setShowMentions(false);
    setMentionSearchActive(false);
    
    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = atIndex + selectedUser.username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleMentionKeyDown = (e) => {
    if (!showMentions || mentionSuggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex((prev) => 
        prev < mentionSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && mentionSearchActive) {
      e.preventDefault();
      if (mentionSuggestions[selectedMentionIndex]) {
        handleMentionSelect(mentionSuggestions[selectedMentionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowMentions(false);
      setMentionSearchActive(false);
    }
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (videoFile) {
      toast.error('Cannot add images with video');
      return;
    }
    if (files.length + imageFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newImageFiles = [...imageFiles, ...files];
    setImageFiles(newImageFiles);

    // Generate previews and upload immediately
    const uploadPromises = [];
    const newPreviews = [];
    
    for (const file of files) {
      // Generate preview
      const previewPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          resolve();
        };
        reader.readAsDataURL(file);
      });
      
      // Upload to server
      const uploadPromise = postsAPI.uploadImage(file);
      uploadPromises.push(uploadPromise);
      
      await previewPromise;
    }
    
    setImagePreviews([...imagePreviews, ...newPreviews]);
    
    try {
      const uploadResults = await Promise.all(uploadPromises);
      const newUrls = uploadResults.map(res => res.data.url);
      setUploadedImageUrls([...uploadedImageUrls, ...newUrls]);
    } catch (error) {
      toast.error('Failed to upload some images');
      console.error('Upload error:', error);
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (imageFiles.length > 0) {
      toast.error('Cannot add video with images');
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video file too large. Maximum size is 50MB');
      return;
    }

    setVideoFile(file);

    // Generate video preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newUrls = uploadedImageUrls.filter((_, i) => i !== index);
    
    // Remove tags associated with this image
    const newTags = imageTags.filter(tag => tag.image_index !== index)
      .map(tag => ({
        ...tag,
        image_index: tag.image_index > index ? tag.image_index - 1 : tag.image_index
      }));
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    setUploadedImageUrls(newUrls);
    setImageTags(newTags);
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
  };

  const openTagImage = (index) => {
    setTagImageIndex(index);
  };

  const openCropModal = (index) => {
    setCurrentCropIndex(index);
    setCurrentCropImage(imagePreviews[index]);
    setCropModalOpen(true);
  };

  const handleCropComplete = async (croppedFile) => {
    if (currentCropIndex === null) return;

    try {
      // Update the file
      const newFiles = [...imageFiles];
      newFiles[currentCropIndex] = croppedFile;
      setImageFiles(newFiles);

      // Update preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreviews = [...imagePreviews];
        newPreviews[currentCropIndex] = reader.result;
        setImagePreviews(newPreviews);
      };
      reader.readAsDataURL(croppedFile);

      // Re-upload the cropped image
      const uploadResponse = await postsAPI.uploadImage(croppedFile);
      const newUrls = [...uploadedImageUrls];
      newUrls[currentCropIndex] = uploadResponse.data.url;
      setUploadedImageUrls(newUrls);

      toast.success('Image edited successfully');
    } catch (error) {
      toast.error('Failed to upload edited image');
      console.error('Upload error:', error);
    }
  };

  const handleImageTagsChange = (index, tags) => {
    // Remove old tags for this image and add new ones
    const otherTags = imageTags.filter(tag => tag.image_index !== index);
    const updatedTags = [...otherTags, ...tags];
    setImageTags(updatedTags);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim() && imageFiles.length === 0 && !videoFile) {
      toast.error('Please add some text, an image, or a video');
      return;
    }

    setLoading(true);

    try {
      let videoUrl = null;
      
      // Upload video if selected
      if (videoFile) {
        const uploadResponse = await postsAPI.uploadVideo(videoFile);
        videoUrl = uploadResponse.data.url;
      }

      const postData = {
        text: text.trim(),
        images: uploadedImageUrls,
        image_url: uploadedImageUrls[0] || null,
        video_url: videoUrl,
        image_tags: imageTags,
        visibility: visibility
      };

      // Create post with or without collaborator
      if (collaborator) {
        await collaborationsAPI.createWithInvite({
          ...postData,
          collaborator_username: collaborator.username
        });
        toast.success(`Post created! Collaboration invite sent to @${collaborator.username}`);
      } else {
        await postsAPI.create(postData);
        toast.success('Post created successfully!');
      }

      setText('');
      setImageFiles([]);
      setImagePreviews([]);
      setUploadedImageUrls([]);
      setImageTags([]);
      setVideoFile(null);
      setVideoPreview(null);
      setVisibility('public');
      setCollaborator(null);
      
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const getImageTagsForIndex = (index) => {
    return imageTags.filter(tag => tag.image_index === index);
  };

  return (
    <>
      <Card className="mb-5 card-premium">
        <CardContent className="pt-5 pb-5 px-4 sm:px-5">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3 sm:gap-4">
              <Avatar className="w-11 h-11 sm:w-10 sm:h-10 ring-2 ring-border flex-shrink-0">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="What's on your mind? Type @ to mention someone"
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={handleMentionKeyDown}
                  className="textarea-mobile min-h-[120px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 bg-transparent placeholder:text-text-muted text-base"
                />
                
                {showMentions && mentionSuggestions.length > 0 && (
                  <MentionAutocomplete
                    suggestions={mentionSuggestions}
                    position={mentionPosition}
                    onSelect={handleMentionSelect}
                    selectedIndex={selectedMentionIndex}
                  />
                )}
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <LazyImage
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-40 sm:h-44 object-cover rounded-xl"
                          loading="eager"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-xl flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-target h-10 sm:h-8"
                            onClick={() => openCropModal(index)}
                          >
                            <Crop className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-target h-10 sm:h-8"
                            onClick={() => openTagImage(index)}
                          >
                            <TagIcon className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Tag</span>
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-9 w-9 sm:h-7 sm:w-7 touch-target tap-feedback shadow-lg"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-5 w-5 sm:h-4 sm:w-4" />
                        </Button>
                        {getImageTagsForIndex(index).length > 0 && (
                          <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1.5">
                            <TagIcon className="h-3 w-3" />
                            {getImageTagsForIndex(index).length}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {videoPreview && (
                  <div className="relative">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full max-h-96 rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={removeVideo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Collaborator Selector */}
                <CollaboratorSelector
                  collaborator={collaborator}
                  onCollaboratorChange={setCollaborator}
                  open={collaboratorDialogOpen}
                  onOpenChange={setCollaboratorDialogOpen}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-border gap-4">
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="file"
                      id="post-image"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <label htmlFor="post-image">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer hover-accent h-11 sm:h-9 px-3 sm:px-2 touch-target touch-manipulation tap-feedback no-select"
                        asChild
                        disabled={imageFiles.length >= 5 || videoFile}
                      >
                        <span className="flex items-center gap-2 sm:gap-1.5">
                          <Image className="h-5 w-5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline text-sm">Add Images {imageFiles.length > 0 && `(${imageFiles.length}/5)`}</span>
                        </span>
                      </Button>
                    </label>

                    <input
                      type="file"
                      id="post-video"
                      accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                      onChange={handleVideoSelect}
                      className="hidden"
                    />
                    <label htmlFor="post-video">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer hover-accent h-11 sm:h-9 px-3 sm:px-2 touch-target touch-manipulation tap-feedback no-select"
                        asChild
                        disabled={videoFile || imageFiles.length > 0}
                      >
                        <span className="flex items-center gap-2 sm:gap-1.5">
                          <Video className="h-5 w-5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline text-sm">Add Video</span>
                        </span>
                      </Button>
                    </label>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="hover-accent h-11 sm:h-9 px-3 sm:px-2 touch-target touch-manipulation tap-feedback no-select"
                        >
                          {visibility === 'public' ? (
                            <span className="flex items-center gap-2 sm:gap-1.5">
                              <Globe className="h-5 w-5 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline text-sm">Everyone</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 sm:gap-1.5">
                              <Users className="h-5 w-5 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline text-sm">Close Friends</span>
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-[180px]">
                        <DropdownMenuItem onClick={() => setVisibility('public')} className="h-12 sm:h-10 text-base sm:text-sm">
                          <Globe className="h-5 w-5 sm:h-4 sm:w-4 mr-3 sm:mr-2" />
                          Everyone
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setVisibility('close_friends')} className="h-12 sm:h-10 text-base sm:text-sm">
                          <Users className="h-5 w-5 sm:h-4 sm:w-4 mr-3 sm:mr-2" />
                          Close Friends
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Button type="submit" disabled={loading} className="button-primary h-12 sm:h-10 w-full sm:w-auto px-8 text-base font-semibold touch-manipulation tap-feedback-lg no-select">
                    {loading ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Image Crop Modal */}
      {cropModalOpen && currentCropImage && (
        <ImageCropModal
          open={cropModalOpen}
          onClose={() => {
            setCropModalOpen(false);
            setCurrentCropImage(null);
            setCurrentCropIndex(null);
          }}
          imageSrc={currentCropImage}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Image Tagging Modal */}
      {tagImageIndex !== null && uploadedImageUrls[tagImageIndex] && (
        <ImageTagging
          imageUrl={uploadedImageUrls[tagImageIndex]}
          imageIndex={tagImageIndex}
          existingTags={getImageTagsForIndex(tagImageIndex)}
          onTagsChange={(tags) => handleImageTagsChange(tagImageIndex, tags)}
          onClose={() => setTagImageIndex(null)}
        />
      )}
    </>
  );
}
