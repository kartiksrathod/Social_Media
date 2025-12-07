import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flag } from 'lucide-react';
import ReportDialog from './ReportDialog';

export default function ReportButton({ type, targetId, targetName, variant = 'ghost', size = 'sm' }) {
  const [showReportDialog, setShowReportDialog] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowReportDialog(true);
        }}
        className="gap-2 text-muted-foreground hover:text-destructive"
      >
        <Flag className="w-4 h-4" />
        Report
      </Button>

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        type={type}
        targetId={targetId}
        targetName={targetName}
      />
    </>
  );
}
