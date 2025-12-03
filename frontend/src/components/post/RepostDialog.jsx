import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Repeat2, MessageSquareQuote } from 'lucide-react';
import { postsAPI } from '../../lib/api';
import { toast } from 'sonner';

export default function RepostDialog({ post, open, onOpenChange, onRepost }) {
  const [quoteText, setQuoteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null); // 'simple' or 'quote'

  const handleSimpleRepost = async () => {
    setLoading(true);
    try {
      await postsAPI.repost(post.id);
      toast.success('Post reposted to your feed!');
      onOpenChange(false);
      if (onRepost) onRepost();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to repost';
      if (errorMsg.includes('already reposted')) {
        toast.error('You have already reposted this post');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuotePost = async () => {
    if (!quoteText.trim()) {
      toast.error('Please add your commentary');
      return;
    }

    setLoading(true);
    try {
      await postsAPI.quote(post.id, quoteText.trim());
      toast.success('Quote post created!');
      setQuoteText('');
      setMode(null);
      onOpenChange(false);
      if (onRepost) onRepost();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create quote post');
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setMode(null);
    setQuoteText('');
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  // Truncate long post text for preview
  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'quote' ? 'Quote Post' : 'Repost'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode selection or Quote input */}
          {!mode ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Share this post with your followers
              </p>

              <Button
                onClick={() => setMode('quote')}
                className="w-full justify-start gap-3 h-auto py-4"
                variant="outline"
              >
                <MessageSquareQuote className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">Quote Post</div>
                  <div className="text-xs text-muted-foreground">Add your thoughts about this post</div>
                </div>
              </Button>

              <Button
                onClick={handleSimpleRepost}
                disabled={loading}
                className="w-full justify-start gap-3 h-auto py-4"
                variant="outline"
              >
                <Repeat2 className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <div className="font-semibold">Repost</div>
                  <div className="text-xs text-muted-foreground">Share instantly to your feed</div>
                </div>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Textarea
                placeholder="Add your commentary..."
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground text-right">
                {quoteText.length}/500
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setMode(null)}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleQuotePost}
                  disabled={loading || !quoteText.trim()}
                  className="flex-1"
                >
                  {loading ? 'Posting...' : 'Quote Post'}
                </Button>
              </div>
            </div>
          )}

          {/* Original post preview */}
          <div className="border border-border/50 rounded-lg p-3 bg-muted/30">
            <div className="flex gap-2 mb-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={post.author_avatar} />
                <AvatarFallback>{post.author_username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{post.author_username}</p>
                <p className="text-xs text-muted-foreground">@{post.author_username}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {truncateText(post.text)}
            </p>
            {post.image_url && (
              <img 
                src={post.image_url} 
                alt="Post" 
                className="mt-2 rounded-md max-h-32 object-cover w-full"
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
