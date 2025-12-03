import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, MoreHorizontal, Bookmark, Share2, Check, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { postsAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.is_saved);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isOwnPost = user && post.author_id === user.id;
  const postImages = post.images && post.images.length > 0 ? post.images : (post.image_url ? [post.image_url] : []);

  const handleLike = async () => {
    try {
      if (liked) {
        await postsAPI.unlike(post.id);
        setLiked(false);
        setLikeCount(likeCount - 1);
      } else {
        await postsAPI.like(post.id);
        setLiked(true);
        setLikeCount(likeCount + 1);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update like');
    }
  };

  const loadComments = async () => {
    try {
      const response = await postsAPI.getComments(post.id);
      setComments(response.data);
    } catch (error) {
      toast.error('Failed to load comments');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setLoadingComment(true);
    try {
      const response = await postsAPI.addComment(post.id, commentText.trim());
      setComments([...comments, response.data]);
      setCommentText('');
      toast.success('Comment added');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add comment');
    } finally {
      setLoadingComment(false);
    }
  };

  const handleSave = async () => {
    try {
      if (saved) {
        await postsAPI.unsave(post.id);
        setSaved(false);
        toast.success('Post removed from saved');
      } else {
        await postsAPI.save(post.id);
        setSaved(true);
        toast.success('Post saved');
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save post');
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) {
      toast.error('Post text cannot be empty');
      return;
    }

    try {
      await postsAPI.update(post.id, { text: editText.trim() });
      toast.success('Post updated successfully');
      setEditOpen(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update post');
    }
  };

  const handleDelete = async () => {
    try {
      await postsAPI.delete(post.id);
      toast.success('Post deleted successfully');
      setDeleteOpen(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete post');
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % postImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + postImages.length) % postImages.length);
  };

  const formatTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  const renderTextWithHashtagsAndMentions = (text) => {
    const parts = text.split(/(#\w+|@\w+)/g);
    return parts.map((part, index) => {
      if (part.match(/^#\w+$/)) {
        const tag = part.slice(1);
        return (
          <Link 
            key={index} 
            to={`/hashtag/${tag}`} 
            className="text-primary hover:underline font-medium"
          >
            {part}
          </Link>
        );
      } else if (part.match(/^@\w+$/)) {
        const username = part.slice(1);
        return (
          <Link 
            key={index} 
            to={`/profile/${username}`} 
            className="text-blue-500 hover:underline font-medium"
          >
            {part}
          </Link>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden bg-card">
      <CardHeader className="p-4 pb-2 flex flex-row items-start gap-4 space-y-0">
        <Link to={`/profile/${post.author_username}`}>
          <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all">
            <AvatarImage src={post.author_avatar} />
            <AvatarFallback>{post.author_username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <Link to={`/profile/${post.author_username}`}>
                <h4 className="font-semibold text-sm hover:underline cursor-pointer">
                  {post.author_username}
                </h4>
              </Link>
              <p className="text-xs text-muted-foreground">
                @{post.author_username} • {formatTime(post.created_at)}
              </p>
            </div>
            {isOwnPost && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 space-y-4">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {renderTextWithHashtagsAndMentions(post.text)}
          {post.edited_at && (
            <span className="text-xs text-muted-foreground ml-2">(edited)</span>
          )}
        </p>
        
        {postImages.length > 0 && (
          <div className="relative rounded-xl overflow-hidden border border-border/50 bg-muted">
            <img 
              src={postImages[currentImageIndex]} 
              alt="Post content" 
              className="w-full h-auto object-cover max-h-[500px]"
            />
            {postImages.length > 1 && (
              <>
                <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                  {currentImageIndex + 1} / {postImages.length}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-8 w-8"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-8 w-8"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full text-muted-foreground">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`group px-2 h-8 hover:text-accent ${liked ? 'text-accent' : ''}`}
              onClick={handleLike}
            >
              <Heart className={`w-5 h-5 mr-1.5 transition-transform group-active:scale-75 ${liked ? 'fill-current' : ''}`} />
              <span className="text-xs font-medium">{likeCount}</span>
            </Button>

            <Dialog open={commentsOpen} onOpenChange={(open) => {
              setCommentsOpen(open);
              if (open) loadComments();
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="group px-2 h-8 hover:text-primary">
                  <MessageCircle className="w-5 h-5 mr-1.5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium">{post.comments_count}</span>
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Comments</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <form onSubmit={handleAddComment} className="flex gap-3">
                  <Input 
                    placeholder="Write a comment..." 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={loadingComment}
                  />
                  <Button type="submit" disabled={loadingComment || !commentText.trim()}>
                    {loadingComment ? 'Posting...' : 'Post'}
                  </Button>
                </form>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {comments.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.avatar} />
                          <AvatarFallback>{comment.username?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="bg-muted/50 p-3 rounded-xl rounded-tl-none text-sm flex-1">
                          <span className="font-semibold block text-xs mb-1">@{comment.username}</span>
                          {comment.text}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(comment.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`group px-2 h-8 hover:text-primary ${saved ? 'text-primary' : ''}`}
              onClick={handleSave}
            >
              <Bookmark className={`w-5 h-5 transition-transform group-active:scale-75 ${saved ? 'fill-current' : ''}`} />
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="group px-2 h-8 hover:text-primary"
              onClick={handleShare}
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              )}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
