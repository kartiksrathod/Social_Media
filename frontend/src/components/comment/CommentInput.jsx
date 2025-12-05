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
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span>Replying to <span className="font-semibold">@{replyingTo}</span></span>
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="ml-auto text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={2}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {text.length}/{maxLength}
          </div>
        </div>
        
        <div className="flex gap-2 items-start">
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-10"
            title={buttonText}
          >
            <Send className="w-4 h-4" />
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors h-10"
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