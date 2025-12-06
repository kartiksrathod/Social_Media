import React, { useState, useEffect } from 'react';
import { messagesAPI, usersAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import ConversationList from '../components/message/ConversationList';
import ChatInterface from '../components/message/ChatInterface';
import { MessageCircle, Search, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchConversations = async () => {
    try {
      const response = await messagesAPI.getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleNewMessage = (message) => {
    // Update conversation's last message
    setConversations(prev =>
      prev.map(conv =>
        conv.id === message.conversation_id
          ? {
              ...conv,
              last_message: message.text || '[Media]',
              last_message_at: message.created_at,
            }
          : conv
      )
    );
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await usersAPI.search(query);
      // Filter out current user
      setSearchResults(response.data.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleStartConversation = async (participant) => {
    try {
      const response = await messagesAPI.createConversation(participant.id);
      const conversation = response.data;

      // Check if conversation already exists in list
      const existing = conversations.find(c => c.id === conversation.id);
      if (!existing) {
        setConversations(prev => [conversation, ...prev]);
      }

      setSelectedConversation(conversation);
      setNewChatOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] border-t border-border">
      {/* Conversations List */}
      <div className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-96 border-r border-border flex flex-col`}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">Messages</h1>
          <Button
            size="icon"
            variant="ghost"
            className="h-11 w-11 sm:h-10 sm:w-10 touch-target touch-manipulation tap-feedback"
            onClick={() => setNewChatOpen(true)}
          >
            <MessageCircle className="w-6 h-6 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto scroll-smooth-mobile">
          {loading ? (
            <div className="p-4 space-y-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-14 h-14 sm:w-12 sm:h-12 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 sm:h-4 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-4 sm:h-3 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 sm:p-10 text-center">
              <MessageCircle className="w-20 h-20 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl sm:text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-base sm:text-sm text-muted-foreground mb-5 sm:mb-4">
                Start a conversation with someone!
              </p>
              <Button onClick={() => setNewChatOpen(true)} className="h-12 sm:h-10 px-6 text-base sm:text-sm touch-manipulation tap-feedback-lg">
                New Message
              </Button>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelect={handleConversationSelect}
            />
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className={`${selectedConversation ? 'block' : 'hidden md:block'} flex-1`}>
        {selectedConversation ? (
          <ChatInterface
            conversation={selectedConversation}
            onBack={() => setSelectedConversation(null)}
            onNewMessage={handleNewMessage}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div>
              <MessageCircle className="w-24 h-24 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
              <p className="text-muted-foreground mb-6">
                Select a conversation or start a new one
              </p>
              <Button onClick={() => setNewChatOpen(true)}>
                New Message
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {searchLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchResults.length === 0 && searchQuery ? (
                <p className="text-center text-muted-foreground py-8">
                  No users found
                </p>
              ) : searchResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Search for users to start a conversation
                </p>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((searchUser) => (
                    <button
                      key={searchUser.id}
                      onClick={() => handleStartConversation(searchUser)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={searchUser.avatar} />
                        <AvatarFallback>
                          {searchUser.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium">{searchUser.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {searchUser.bio?.substring(0, 50) || 'No bio'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
