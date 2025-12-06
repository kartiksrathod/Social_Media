import React, { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import MentionAutocomplete from '../post/MentionAutocomplete';

const CommentInput = ({ 
  onSubmit, 
  onCancel, 
  placeholder = 'Add a comment...', 
  initialValue = '',
  autoFocus = false,
  buttonText = 'Post',
  replyingTo = null
}) => {
  const [text, setText] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);
  const maxLength = 500;

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    const cursorPos = e.target.selectionStart;
    setText(newText);
    setCursorPosition(cursorPos);

    // Check for @ mention trigger
    const textBeforeCursor = newText.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1 && lastAtSymbol === cursorPos - 1) {
      // Just typed @
      setShowMentions(true);
      setMentionSearch('');
    } else if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      // Check if there's no space after @
      if (!textAfterAt.includes(' ')) {
        setShowMentions(true);
        setMentionSearch(textAfterAt);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (username) => {
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = text.substring(cursorPosition);
    
    const newText = text.substring(0, lastAtSymbol) + `@${username} ` + textAfterCursor;
    setText(newText);
    setShowMentions(false);
    
    // Focus back on textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
      const newCursorPos = lastAtSymbol + username.length + 2;
      setTimeout(() => {
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setText('');
    if (onCancel) onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {replyingTo && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-2 surface-700 rounded-lg border border-border/50">
          <span>Replying to <span className="font-semibold text-primary">@{replyingTo}</span></span>
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="ml-auto hover-accent"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={2}
            className="w-full px-4 py-2 surface-700 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {text.length}/{maxLength}
          </div>
          
          {showMentions && (
            <MentionAutocomplete
              searchQuery={mentionSearch}
              onSelect={handleMentionSelect}
              onClose={() => setShowMentions(false)}
            />
          )}
        </div>
        
        <div className="flex gap-2 items-start">
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all h-10 glow-subtle hover:glow-primary"
            title={buttonText}
          >
            <Send className="w-4 h-4" />
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 surface-700 text-foreground rounded-lg hover:surface-600 transition-colors h-10 border border-border"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default CommentInput;