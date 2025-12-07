import React from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';

export default function EmojiPickerComponent({ onEmojiClick, trigger, align = 'start' }) {
  const [open, setOpen] = React.useState(false);

  const handleEmojiClick = (emojiObject) => {
    onEmojiClick(emojiObject.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-foreground"
          >
            <Smile className="w-5 h-5" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 border-none shadow-lg" 
        align={align}
        side="top"
      >
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          autoFocusSearch={false}
          theme="auto"
          width={320}
          height={400}
          previewConfig={{
            showPreview: false
          }}
          searchPlaceHolder="Search emoji..."
        />
      </PopoverContent>
    </Popover>
  );
}
