import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, MoreHorizontal, Bookmark, Share2, Check, Edit, Trash2, ChevronLeft, ChevronRight, Repeat2, Star } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { postsAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import RepostDialog from './RepostDialog';
import ReactionButton from './ReactionButton';
import CommentSection from '../comment/CommentSection';

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.is_saved);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count || 0);
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [repostOpen, setRepostOpen] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(post.repost_count || 0);
  const [userReaction, setUserReaction] = useState(post.user_reaction);
  const [reactionCounts, setReactionCounts] = useState(post.reaction_counts || {});

  const isOwnPost = user && post.author_id === user.id;
  const isRepost = post.is_repost;
  const originalPost = post.original_post;
  const postImages = post.images && post.images.length > 0 ? post.images : (post.image_url ? [post.image_url] : []);

  // Check if user has reposted this post
  useEffect(() => {
    const checkReposted = async () => {
      try {
        const targetPostId = isRepost ? post.original_post_id : post.id;
        const response = await postsAPI.checkReposted(targetPostId);
        setReposted(response.data.reposted);
      } catch (error) {
        console.error('Failed to check repost status');
      }
    };
    checkReposted();
  }, [post.id, post.original_post_id, isRepost]);

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

  const handleReact = async (type) => {
    try {
      const response = await postsAPI.react(post.id, type);
      const updatedPost = response.data;
      
      setUserReaction(updatedPost.user_reaction);
      setReactionCounts(updatedPost.reaction_counts);
      
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add reaction');
    }
  };

  const handleRemoveReaction = async () => {
    try {
      const response = await postsAPI.removeReaction(post.id);
      const updatedPost = response.data;
      
      setUserReaction(null);
      setReactionCounts(updatedPost.reaction_counts);
      
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove reaction');
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

  const handleRepostClick = () => {
    if (reposted) {
      handleUnrepost();
    } else {
      setRepostOpen(true);
    }
  };

  const handleUnrepost = async () => {
    try {
      const targetPostId = isRepost ? post.original_post_id : post.id;
      await postsAPI.unrepost(targetPostId);
      setReposted(false);
      setRepostCount(prev => Math.max(0, prev - 1));
      toast.success('Repost removed');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove repost');
    }
  };

  const handleRepostSuccess = () => {
    const targetPostId = isRepost ? post.original_post_id : post.id;
    setReposted(true);
    setRepostCount(prev => prev + 1);
    if (onUpdate) onUpdate();
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
    <Card className="card-premium overflow-hidden bg-card">
      {/* Repost indicator */}
      {isRepost && (
        <div className="px-4 pt-3 pb-0">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Repeat2 className="w-3.5 h-3.5 text-green-500" />
            <span className="font-medium">{post.author_username} reposted</span>
          </div>
        </div>
      )}

      {/* Quote text - shown above original post for quote reposts */}
      {isRepost && post.repost_text && (
        <div className="px-4 pt-3">
          <div className="flex gap-3">
            <Link to={`/profile/${post.author_username}`}>
              <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all">
                <AvatarImage src={post.author_avatar} />
                <AvatarFallback>{post.author_username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <Link to={`/profile/${post.author_username}`}>
                <h4 className="font-semibold text-sm hover:underline cursor-pointer">
                  {post.author_username}
                </h4>
              </Link>
              <p className="text-xs text-muted-foreground mb-2">
                @{post.author_username} • {formatTime(post.created_at)}
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">
                {renderTextWithHashtagsAndMentions(post.repost_text)}
              </p>
            </div>
          </div>
        </div>
      )}

      <CardHeader className={`p-4 pb-2 flex flex-row items-start gap-4 space-y-0 ${isRepost && post.repost_text ? 'pt-0' : ''}`}>
        <Link to={`/profile/${isRepost && originalPost ? originalPost.author_username : post.author_username}`}>
          <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
            <AvatarImage src={isRepost && originalPost ? originalPost.author_avatar : post.author_avatar} />
            <AvatarFallback>{(isRepost && originalPost ? originalPost.author_username : post.author_username)?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              {/* Show collaborative post authors */}
              {post.is_collaborative && post.collaboration_status === 'accepted' ? (
                <div className="flex items-center gap-1 flex-wrap">
                  <Link to={`/profile/${post.author_username}`}>
                    <h4 className="font-semibold text-sm hover:underline cursor-pointer inline">
                      {post.author_username}
                    </h4>
                  </Link>
                  <span className="text-sm text-text-muted">and</span>
                  <Link to={`/profile/${post.collaborator_username}`}>
                    <h4 className="font-semibold text-sm hover:underline cursor-pointer inline">
                      {post.collaborator_username}
                    </h4>
                  </Link>
                  {post.visibility === 'close_friends' && (
                    <Star className="w-3.5 h-3.5 fill-green-500 text-green-500 ml-1" title="Close Friends Only" />
                  )}
                </div>
              ) : (
                <Link to={`/profile/${isRepost && originalPost ? originalPost.author_username : post.author_username}`}>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-semibold text-sm hover:underline cursor-pointer">
                      {isRepost && originalPost ? originalPost.author_username : post.author_username}
                    </h4>
                    {post.visibility === 'close_friends' && (
                      <Star className="w-3.5 h-3.5 fill-green-500 text-green-500" title="Close Friends Only" />
                    )}
                  </div>
                </Link>
              )}
              <p className="text-xs text-text-muted">
                @{isRepost && originalPost ? originalPost.author_username : post.author_username} • {formatTime(isRepost && originalPost ? originalPost.created_at : post.created_at)}
                {post.visibility === 'close_friends' && (
                  <span className="ml-1 text-green-600 dark:text-green-400 font-medium">• Close Friends</span>
                )}
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
      
      <CardContent className={`p-4 pt-2 space-y-4 ${isRepost && post.repost_text ? 'border-l-2 border-primary/30 ml-4 bg-primary/5' : ''}`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
          {renderTextWithHashtagsAndMentions(post.text)}
          {post.edited_at && !isRepost && (
            <span className="text-xs text-text-muted ml-2">(edited)</span>
          )}
        </p>
        
        {postImages.length > 0 && (
          <div className="relative rounded-xl overflow-hidden border border-border bg-surface-700">
            <img 
              src={postImages[currentImageIndex]} 
              alt="Post content" 
              className="w-full h-auto object-cover max-h-[500px]"
            />
            
            {/* Image Tags */}
            {post.image_tags && post.image_tags.filter(tag => tag.image_index === currentImageIndex).map((tag, idx) => (
              <div
                key={idx}
                className="absolute group"
                style={{ 
                  left: `${tag.x}%`, 
                  top: `${tag.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="w-6 h-6 bg-white rounded-full border-2 border-primary shadow-lg cursor-pointer" />
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Link 
                    to={`/profile/${tag.username}`}
                    className="block bg-black/90 text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap text-sm font-medium hover:bg-black"
                  >
                    @{tag.username}
                  </Link>
                </div>
              </div>
            ))}
            
            {postImages.length > 1 && (
              <>
                <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs backdrop-blur-sm">
                  {currentImageIndex + 1} / {postImages.length}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white h-8 w-8 backdrop-blur-sm"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white h-8 w-8 backdrop-blur-sm"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        )}

        {post.video_url && (
          <div className="rounded-xl overflow-hidden border border-border bg-surface-700">
            <video 
              src={post.video_url} 
              controls 
              className="w-full h-auto max-h-[500px]"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t border-border/50">
        <div className="flex items-center justify-between w-full text-text-muted">
          <div className="flex items-center gap-6">
            <ReactionButton
              userReaction={userReaction}
              reactionCounts={reactionCounts}
              onReact={handleReact}
              onRemoveReaction={handleRemoveReaction}
            />

            <Button 
              variant="ghost" 
              size="sm" 
              className="group px-2 h-8 hover-accent"
              onClick={() => setCommentsOpen(true)}
            >
              <MessageCircle className="w-5 h-5 mr-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">{commentCount}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`group px-2 h-8 transition-colors ${saved ? 'text-primary' : 'hover-accent'}`}
              onClick={handleSave}
            >
              <Bookmark className={`w-5 h-5 transition-transform group-active:scale-75 ${saved ? 'fill-current' : ''}`} />
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="group px-2 h-8 hover-accent"
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

      {/* Edit Post Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[150px]"
              placeholder="What's on your mind?"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Comments Section */}
      {commentsOpen && (
        <CommentSection
          postId={post.id}
          onClose={() => setCommentsOpen(false)}
          initialCommentCount={commentCount}
        />
      )}
    </Card>
  );
}
