import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Ban, CheckCircle2 } from 'lucide-react';
import { blockUser, unblockUser, isUserBlocked } from '@/lib/safetyAPI';
import { toast } from 'sonner';

export default function BlockButton({ userId, username, onBlockChange }) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkBlockStatus();
  }, [userId]);

  const checkBlockStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await isUserBlocked(userId);
      setIsBlocked(response.is_blocked);
    } catch (error) {
      console.error('Error checking block status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleBlock = async () => {
    try {
      setLoading(true);
      await blockUser(userId);
      setIsBlocked(true);
      setShowDialog(false);
      toast.success(`Blocked @${username}`, {
        description: 'You will no longer see their posts or receive messages.'
      });
      if (onBlockChange) onBlockChange(true);
    } catch (error) {
      toast.error('Failed to block user');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    try {
      setLoading(true);
      await unblockUser(userId);
      setIsBlocked(false);
      toast.success(`Unblocked @${username}`);
      if (onBlockChange) onBlockChange(false);
    } catch (error) {
      toast.error('Failed to unblock user');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return null;
  }

  if (isBlocked) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleUnblock}
        disabled={loading}
        className="gap-2"
      >
        <CheckCircle2 className="w-4 h-4" />
        {loading ? 'Unblocking...' : 'Blocked'}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Ban className="w-4 h-4" />
        Block
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block @{username}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will not be able to:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>See your posts or profile</li>
                <li>Send you messages</li>
                <li>Follow you or see your activity</li>
              </ul>
              <p className="mt-3 text-sm">
                You won't see their content either. You can unblock them anytime.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? 'Blocking...' : 'Block User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
