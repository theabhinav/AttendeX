import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Trash2,
  Edit2,
  ExternalLink,
  RefreshCw,
  Unlink,
  Check,
  Sparkles,
  UploadCloud,
  Send,
  X,
  FileCheck,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { assignmentService } from '../services/assignmentService';
import { subjectService } from '../services/subjectService';
import { classroomService } from '../services/classroomService';
import toast from 'react-hot-toast';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['Pending', 'In Progress', 'Completed'];

// Google Classroom SVG Logo
const GoogleClassroomLogo = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 48 48">
    <path
      fill="#ffba00"
      d="M42 10v28c0 2.2-1.8 4-4 4H10c-2.2 0-4-1.8-4-4V10c0-2.2 1.8-4 4-4h28c2.2 0 4 1.8 4 4z"
    />
    <path
      fill="#00832d"
      d="M37 38H11c-1.1 0-2-.9-2-2V12c0-1.1.9-2 2-2h26c1.1 0 2 .9 2 2v24c0 1.1-.9 2-2 2z"
    />
    <circle cx="24" cy="20" r="4" fill="#ffffff" />
    <path fill="#ffffff" d="M24 26c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" />
    <circle cx="16" cy="21" r="2.5" fill="#a8dab5" />
    <path fill="#a8dab5" d="M16 25c-2.8 0-5 1.5-5 3.5v.5h4v-1.5c0-.9.4-1.7 1-2.5z" />
    <circle cx="32" cy="21" r="2.5" fill="#a8dab5" />
    <path fill="#a8dab5" d="M32 25c-.6.8-1 1.6-1 2.5v1.5h4v-.5c0-2-2.2-3.5-5-3.5z" />
  </svg>
);

const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  // Google Classroom State
  const [classroomStatus, setClassroomStatus] = useState({
    isConnected: false,
    email: '',
    lastSyncedAt: null,
  });
  const [syncingClassroom, setSyncingClassroom] = useState(false);
  const [connectingClassroom, setConnectingClassroom] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [saving, setSaving] = useState(false);

  // Submit to Classroom Modal State
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedForSubmission, setSelectedForSubmission] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionLinkUrl, setSubmissionLinkUrl] = useState('');
  const [submittingToClassroom, setSubmittingToClassroom] = useState(false);
  const [unsubmittingId, setUnsubmittingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subjectId: '',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'Medium',
    status: 'Pending',
    description: '',
    submissionLink: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [aRes, sRes] = await Promise.all([
        assignmentService.getAssignments({
          status: statusFilter,
          priority: priorityFilter,
          source: sourceFilter,
        }),
        subjectService.getSubjects(),
      ]);

      setAssignments(aRes.assignments || []);
      setSubjects(sRes.subjects || []);
      if (sRes.subjects?.length > 0 && !formData.subjectId) {
        setFormData((prev) => ({ ...prev, subjectId: sRes.subjects[0]._id }));
      }
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, sourceFilter]);

  // Load Google Classroom Connection Status
  const loadClassroomStatus = async () => {
    try {
      const res = await classroomService.getStatus();
      if (res.success) {
        setClassroomStatus({
          isConnected: !!res.isConnected,
          email: res.email || '',
          lastSyncedAt: res.lastSyncedAt || null,
        });
      }
    } catch (e) {
      console.warn('Could not fetch classroom status', e);
    }
  };

  // Trigger Google Classroom Sync
  const handleSyncClassroom = async () => {
    try {
      setSyncingClassroom(true);
      toast.loading('Syncing courses & coursework from Google Classroom...', { id: 'gc-sync' });
      const res = await classroomService.syncClassroom();
      toast.success(res.message || 'Google Classroom synced successfully!', { id: 'gc-sync' });
      await loadClassroomStatus();
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync with Google Classroom', { id: 'gc-sync' });
    } finally {
      setSyncingClassroom(false);
    }
  };

  // Initiate Google Classroom OAuth
  const handleConnectClassroom = async () => {
    try {
      setConnectingClassroom(true);
      toast.loading('Redirecting to Google OAuth...', { id: 'gc-connect' });
      const res = await classroomService.getAuthUrl();
      if (res.authUrl) {
        window.location.href = res.authUrl;
      } else {
        toast.error('Could not generate authorization URL', { id: 'gc-connect' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate Google Classroom connection', { id: 'gc-connect' });
    } finally {
      setConnectingClassroom(false);
    }
  };

  // Disconnect Google Classroom
  const handleDisconnectClassroom = async () => {
    if (!window.confirm('Disconnect Google Classroom? Previously synced assignments will remain in AttendX.')) {
      return;
    }
    try {
      await classroomService.disconnect();
      toast.success('Google Classroom disconnected');
      setClassroomStatus({ isConnected: false, email: '', lastSyncedAt: null });
    } catch (err) {
      toast.error('Failed to disconnect Google Classroom');
    }
  };

  // Open Submission Dialog for Classroom
  const handleOpenSubmitModal = (assignment) => {
    setSelectedForSubmission(assignment);
    setSubmissionFile(null);
    setSubmissionLinkUrl('');
    setSubmitModalOpen(true);
  };

  // Execute Submission to Classroom
  const handleTurnInToClassroom = async (e) => {
    e.preventDefault();
    if (!selectedForSubmission) return;

    if (!submissionFile && !submissionLinkUrl.trim()) {
      toast.error('Please attach a document or provide a link to submit.');
      return;
    }

    const payload = new FormData();
    payload.append('assignmentId', selectedForSubmission._id);
    if (submissionFile) {
      payload.append('submissionFile', submissionFile);
    }
    if (submissionLinkUrl.trim()) {
      payload.append('submissionLink', submissionLinkUrl.trim());
    }

    try {
      setSubmittingToClassroom(true);
      toast.loading('Uploading and turning in to Google Classroom...', { id: 'gc-turnin' });
      const res = await classroomService.submitAssignment(payload);
      toast.success(res.message || 'Turned in to Google Classroom successfully!', { id: 'gc-turnin' });
      setSubmitModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit to Google Classroom', { id: 'gc-turnin' });
    } finally {
      setSubmittingToClassroom(false);
    }
  };

  // Unsubmit from Google Classroom
  const handleUnsubmitFromClassroom = async (assignment) => {
    if (!window.confirm('Unsubmit assignment in Google Classroom? Your submission will be reverted to draft so you can edit files.')) {
      return;
    }

    try {
      setUnsubmittingId(assignment._id);
      toast.loading('Unsubmitting from Google Classroom...', { id: 'gc-unsubmit' });
      const res = await classroomService.unsubmitAssignment(assignment._id);
      toast.success(res.message || 'Unsubmitted successfully!', { id: 'gc-unsubmit' });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unsubmit assignment', { id: 'gc-unsubmit' });
    } finally {
      setUnsubmittingId(null);
    }
  };

  useEffect(() => {
    loadData();
    loadClassroomStatus();
  }, [loadData]);

  const handleOpenModal = (assignment = null) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
        title: assignment.title,
        subjectId: assignment.subjectId?._id || assignment.subjectId,
        dueDate: assignment.dueDate.split('T')[0],
        priority: assignment.priority,
        status: assignment.status,
        description: assignment.description || '',
        submissionLink: assignment.submissionLink || '',
      });
    } else {
      setEditingAssignment(null);
      setFormData({
        title: '',
        subjectId: subjects[0]?._id || '',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'Medium',
        status: 'Pending',
        description: '',
        submissionLink: '',
      });
    }
    setModalOpen(true);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter assignment title');
      return;
    }
    if (!formData.subjectId) {
      toast.error('Please select a subject');
      return;
    }

    try {
      setSaving(true);
      if (editingAssignment) {
        await assignmentService.updateAssignment(editingAssignment._id, formData);
        toast.success('Assignment updated!');
      } else {
        await assignmentService.createAssignment(formData);
        toast.success('New assignment added!');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (assignment, nextStatus) => {
    try {
      await assignmentService.updateAssignment(assignment._id, { status: nextStatus });
      toast.success(`Marked as ${nextStatus}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await assignmentService.deleteAssignment(id);
      toast.success('Assignment deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete assignment');
    }
  };

  // Metrics
  const pendingCount = assignments.filter((a) => a.status === 'Pending').length;
  const inProgressCount = assignments.filter((a) => a.status === 'In Progress').length;
  const completedCount = assignments.filter((a) => a.status === 'Completed').length;

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return <Badge variant="danger">Urgent</Badge>;
      case 'High':
        return <Badge variant="warning">High Priority</Badge>;
      case 'Medium':
        return <Badge variant="brand">Medium</Badge>;
      default:
        return <Badge variant="default">Low</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">
            <FileText className="w-4 h-4" />
            <span>Academic Workload & Deadlines</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Assignments & Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track lab reports, coursework, and Google Classroom assignments from one single place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!classroomStatus.isConnected ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleConnectClassroom}
              isLoading={connectingClassroom}
              leftIcon={GoogleClassroomLogo}
            >
              Connect Classroom
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncClassroom}
              isLoading={syncingClassroom}
              leftIcon={RefreshCw}
            >
              Sync Classroom
            </Button>
          )}

          <Button size="sm" variant="primary" onClick={() => handleOpenModal()} leftIcon={Plus}>
            New Assignment
          </Button>
        </div>
      </div>

      {/* Google Classroom Integration Status Card */}
      <Card className="p-4 bg-gradient-to-r from-emerald-50/50 via-slate-50 to-brand-50/40 dark:from-dark-surface dark:to-dark-card border-brand-200/60 dark:border-dark-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border flex items-center justify-center shrink-0 shadow-sm">
              <GoogleClassroomLogo className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Google Classroom Integration
                </h4>
                {classroomStatus.isConnected ? (
                  <Badge variant="success" size="sm">Connected</Badge>
                ) : (
                  <Badge variant="default" size="sm">Not Connected</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {classroomStatus.isConnected
                  ? `Linked to ${classroomStatus.email}. Auto-fetch coursework and submit assignments directly.`
                  : 'Link your college Google Classroom to auto-import assignments, deadlines, and coursework.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {classroomStatus.isConnected ? (
              <>
                <button
                  onClick={handleSyncClassroom}
                  disabled={syncingClassroom}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingClassroom ? 'animate-spin' : ''}`} />
                  <span>Sync Now</span>
                </button>
                <button
                  onClick={handleDisconnectClassroom}
                  className="px-2.5 py-1.5 rounded-xl text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Disconnect account"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectClassroom}
                disabled={connectingClassroom}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Connect Account</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <span className="text-xs font-medium text-slate-500">Pending Tasks</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pendingCount}</p>
          </div>
          <Clock className="w-8 h-8 text-amber-500/40" />
        </Card>

        <Card className="p-5 flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <span className="text-xs font-medium text-slate-500">In Progress</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{inProgressCount}</p>
          </div>
          <AlertCircle className="w-8 h-8 text-blue-500/40" />
        </Card>

        <Card className="p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <span className="text-xs font-medium text-slate-500">Completed</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {completedCount}
            </p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface px-3 py-1.5 text-slate-900 dark:text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface px-3 py-1.5 text-slate-900 dark:text-white"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface px-3 py-1.5 text-slate-900 dark:text-white"
            >
              <option value="ALL">All Sources</option>
              <option value="classroom">Google Classroom</option>
              <option value="manual">Manual Entry</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-400">
          Showing {assignments.length} assignments
        </span>
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <Card className="text-center py-12 space-y-3">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No assignments found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You are all caught up! Click 'New Assignment' or sync from Google Classroom to load coursework.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((assignment) => {
            const isGoogleClassroom = assignment.source === 'classroom';
            const isSubmitted = assignment.submissionStatus === 'TURNED_IN' || assignment.status === 'Completed';

            return (
              <Card
                key={assignment._id}
                className="p-5 flex flex-col justify-between space-y-4 hover:border-brand-500/30 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(assignment.priority)}
                      {isGoogleClassroom && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <GoogleClassroomLogo className="w-3 h-3" />
                          <span>Classroom</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenModal(assignment)}
                        className="p-1 text-slate-400 hover:text-brand-600 rounded"
                        title="Edit Assignment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(assignment._id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                    {assignment.title}
                  </h3>
                  <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
                    {assignment.subjectId?.name || 'General Subject'}{' '}
                    {assignment.subjectId?.code ? `(${assignment.subjectId.code})` : ''}
                  </p>

                  {assignment.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">
                      {assignment.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>

                    {assignment.submissionLink && (
                      <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <a
                          href={assignment.submissionLink}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline truncate"
                        >
                          Assignment Attachment Link
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-dark-border flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Status: <strong className="text-slate-700 dark:text-slate-300">{assignment.status}</strong>
                    </span>

                    <select
                      value={assignment.status}
                      onChange={(e) => handleStatusToggle(assignment, e.target.value)}
                      className="text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface px-2 py-1 text-slate-800 dark:text-slate-200"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 1-Click Google Classroom Turn In / Unsubmit Button */}
                  {isGoogleClassroom && (
                    <div className="pt-2 border-t border-slate-100 dark:border-dark-border flex items-center justify-between gap-2">
                      {isSubmitted ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Turned In to Classroom</span>
                          </span>
                          <button
                            onClick={() => handleUnsubmitFromClassroom(assignment)}
                            disabled={unsubmittingId === assignment._id}
                            className="text-[11px] font-bold text-slate-500 hover:text-rose-600 underline"
                          >
                            {unsubmittingId === assignment._id ? 'Unsubmitting...' : 'Unsubmit'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenSubmitModal(assignment)}
                          className="w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Turn In to Google Classroom</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal for Create / Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
      >
        <form onSubmit={handleSaveAssignment} className="space-y-4">
          <Input
            label="Assignment Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Data Structures Lab Report 3"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
                Subject
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-xs px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500"
                required
              >
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-xs px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-xs px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
              Description / Instructions (Optional)
            </label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter assignment notes, formatting specifications, or submission details..."
              className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-xs p-3 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <Input
            label="Attachment / Reference Link (Optional)"
            type="url"
            value={formData.submissionLink}
            onChange={(e) => setFormData({ ...formData, submissionLink: e.target.value })}
            placeholder="https://drive.google.com/..."
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {editingAssignment ? 'Save Changes' : 'Create Assignment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal for Turn In to Google Classroom */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Submit to Google Classroom"
      >
        <form onSubmit={handleTurnInToClassroom} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-xs">
            <p className="font-bold text-slate-900 dark:text-white">
              {selectedForSubmission?.title}
            </p>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              Course: {selectedForSubmission?.subjectId?.name || 'Classroom Subject'}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
              Upload Document / File (PDF, DOCX, ZIP, etc.)
            </label>
            <input
              type="file"
              onChange={(e) => setSubmissionFile(e.target.files[0] || null)}
              className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              File will be uploaded to your Google Drive and attached to the assignment.
            </p>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-dark-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
              <span className="bg-white dark:bg-dark-card px-2">And / Or External Link</span>
            </div>
          </div>

          <Input
            label="Google Drive / GitHub / Website Link"
            type="url"
            value={submissionLinkUrl}
            onChange={(e) => setSubmissionLinkUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submittingToClassroom}
              leftIcon={UploadCloud}
            >
              Turn In Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AssignmentsPage;
