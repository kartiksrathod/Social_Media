import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Flag } from 'lucide-react';
import { reportContent } from '@/lib/safetyAPI';
import { toast } from 'sonner';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam', description: 'Unwanted commercial content or repetitive messages' },
  { value: 'harassment', label: 'Harassment', description: 'Bullying, threats, or abusive behavior' },
  { value: 'hate_speech', label: 'Hate Speech', description: 'Promotes hate based on identity' },
  { value: 'violence', label: 'Violence', description: 'Glorifies or incites violence' },
  { value: 'misinformation', label: 'Misinformation', description: 'False or misleading information' },
  { value: 'nudity', label: 'Nudity/Sexual Content', description: 'Inappropriate adult content' },
  { value: 'illegal', label: 'Illegal Activity', description: 'Promotes illegal activities' },
  { value: 'other', label: 'Other', description: 'Something else not listed' },
];

export default function ReportDialog({ open, onOpenChange, type, targetId, targetName }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    try {
      setLoading(true);
      await reportContent(type, targetId, reason, description);
      
      toast.success('Report submitted', {
        description: 'Thank you for helping keep our community safe. We\'ll review this shortly.'
      });
      
      // Reset and close
      setReason('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      if (error.response?.data?.detail === 'You have already reported this') {
        toast.error('You have already reported this');
      } else {
        toast.error('Failed to submit report');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Report {type === 'post' ? 'Post' : type === 'comment' ? 'Comment' : 'User'}
          </DialogTitle>
          <DialogDescription>
            {targetName && `Reporting ${type} by @${targetName}`}
            <br />
            Your report is anonymous. We'll review it and take appropriate action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Why are you reporting this?</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((item) => (
                <div key={item.value} className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value={item.value} id={item.value} />
                  <Label
                    htmlFor={item.value}
                    className="font-normal cursor-pointer flex-1"
                  >
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide more context about why you're reporting this..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !reason}
            className="gap-2"
          >
            <Flag className="w-4 h-4" />
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
