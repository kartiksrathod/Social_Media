import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag, AlertCircle, CheckCircle2, XCircle, Clock, Eye, Trash2 } from 'lucide-react';
import { getAdminReports, updateReportStatus, deleteReport } from '@/lib/safetyAPI';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  pending: 'bg-yellow-500',
  reviewing: 'bg-blue-500',
  resolved: 'bg-green-500',
  dismissed: 'bg-gray-500'
};

const REASON_LABELS = {
  spam: 'Spam',
  harassment: 'Harassment',
  hate_speech: 'Hate Speech',
  violence: 'Violence',
  misinformation: 'Misinformation',
  nudity: 'Nudity/Sexual Content',
  illegal: 'Illegal Activity',
  other: 'Other'
};

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [expandedReport, setExpandedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadReports();
  }, [selectedStatus, selectedType]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedType !== 'all') params.type = selectedType;

      const response = await getAdminReports(params);
      setReports(response.data);
      setCounts(response.counts);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to load reports');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      setUpdating(true);
      await updateReportStatus(reportId, newStatus, adminNotes);
      toast.success('Report status updated');
      setAdminNotes('');
      setExpandedReport(null);
      loadReports();
    } catch (error) {
      toast.error('Failed to update report');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await deleteReport(reportId);
      toast.success('Report deleted');
      loadReports();
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const ReportCard = ({ report }) => {
    const isExpanded = expandedReport === report.id;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="capitalize">
                  {report.type}
                </Badge>
                <Badge className={STATUS_COLORS[report.status]}>
                  {report.status}
                </Badge>
                <Badge variant="outline">
                  {REASON_LABELS[report.reason]}
                </Badge>
              </div>
              <CardTitle className="text-base">
                Reported by @{report.reporter_username}
              </CardTitle>
              <CardDescription>
                {report.target_username && `Target: @${report.target_username} • `}
                {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedReport(isExpanded ? null : report.id)}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-4">
            {report.description && (
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm">{report.description}</p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateStatus(report.id, 'reviewing')}
                disabled={updating || report.status === 'reviewing'}
                className="gap-2"
              >
                <Clock className="w-4 h-4" />
                Mark Reviewing
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateStatus(report.id, 'resolved')}
                disabled={updating || report.status === 'resolved'}
                className="gap-2 text-green-600 hover:text-green-700"
              >
                <CheckCircle2 className="w-4 h-4" />
                Resolve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                disabled={updating || report.status === 'dismissed'}
                className="gap-2"
              >
                <XCircle className="w-4 h-4" />
                Dismiss
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteReport(report.id)}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                placeholder="Add notes about your decision..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
              />
            </div>

            {report.admin_notes && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Previous notes:</strong> {report.admin_notes}
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-2 text-xs text-muted-foreground border-t">
              <div>Report ID: {report.id}</div>
              <div>Target ID: {report.target_id}</div>
              {report.resolved_by && (
                <div>Resolved by: {report.resolved_by}</div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Flag className="w-8 h-8" />
          Admin Dashboard - Reports
        </h1>
        <p className="text-muted-foreground">
          Review and manage user-reported content
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {counts.pending || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reviewing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {counts.reviewing || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {counts.resolved || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dismissed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {counts.dismissed || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="post">Posts</SelectItem>
                  <SelectItem value="comment">Comments</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadReports} variant="outline">
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No reports found</p>
          </CardContent>
        </Card>
      ) : (
        <div>
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
