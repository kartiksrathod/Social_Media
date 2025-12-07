import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Ban, CheckCircle2 } from 'lucide-react';
import { getBlockedUsers, unblockUser } from '@/lib/safetyAPI';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function BlockedUsers() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState({});

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const response = await getBlockedUsers();
      setBlocks(response.data);
    } catch (error) {
      toast.error('Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId, username) => {
    try {
      setUnblocking({ ...unblocking, [userId]: true });
      await unblockUser(userId);
      toast.success(`Unblocked @${username}`);
      loadBlockedUsers();
    } catch (error) {
      toast.error('Failed to unblock user');
    } finally {
      setUnblocking({ ...unblocking, [userId]: false });
    }
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Ban className="w-6 h-6" />
          Blocked Users
        </h1>
        <p className="text-muted-foreground">
          Users you've blocked won't be able to see your profile or interact with you.
        </p>
      </div>

      {blocks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ban className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You haven't blocked anyone</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {blocks.map((block) => {
            const user = block.blocked_user;
            if (!user) return null;

            return (
              <Card key={block.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">@{user.username}</p>
                        {user.name && (
                          <p className="text-sm text-muted-foreground">{user.name}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Blocked {formatDistanceToNow(new Date(block.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblock(user.id, user.username)}
                      disabled={unblocking[user.id]}
                      className="gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {unblocking[user.id] ? 'Unblocking...' : 'Unblock'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
