import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';

export default function ConversationList({ conversations, selectedConversation, onSelect }) {
  return (
    <div className="divide-y divide-border">
      {conversations.map((conversation) => {
        const isSelected = selectedConversation?.id === conversation.id;
        const participant = conversation.participant_info;
        const hasUnread = conversation.unread_count > 0;

        return (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation)}
            className={`w-full flex items-center gap-3 p-4 hover:bg-accent transition-colors ${
              isSelected ? 'bg-accent' : ''
            }`}
          >
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarImage src={participant?.avatar} />
                <AvatarFallback>
                  {participant?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {hasUnread && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-bold">
                  {conversation.unread_count}
                </div>
              )}
            </div>

            <div className="flex-1 text-left overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-semibold truncate ${hasUnread ? 'text-foreground' : 'text-foreground'}`}>
                  {participant?.username || 'Unknown User'}
                </h3>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {conversation.last_message_at
                    ? formatDistanceToNow(new Date(conversation.last_message_at), {
                        addSuffix: true,
                      }).replace('about ', '')
                    : ''}
                </span>
              </div>
              <p
                className={`text-sm truncate ${
                  hasUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {conversation.last_message || 'No messages yet'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
