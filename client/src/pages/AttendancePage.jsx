import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Calendar,
  Filter,
  Plus,
  Edit2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  BookOpen,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { subjectService } from '../services/subjectService';
import AttendanceCalendar from '../components/attendance/AttendanceCalendar';
import EditAttendanceModal from '../components/attendance/EditAttendanceModal';
import LeaveApplicationModal from '../components/attendance/LeaveApplicationModal';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import { formatDateISO } from '../utils/dateUtils';
import toast from 'react-hot-toast';

const AttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'history'

  // Edit / Details Modals
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedDateRecords, setSelectedDateRecords] = useState(null); // { date, records }
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Manual Mark Form State
  const [manualSubjectId, setManualSubjectId] = useState('');
  const [manualDate, setManualDate] = useState(formatDateISO());
  const [manualStatus, setManualStatus] = useState('Present');
  const [manualNotes, setManualNotes] = useState('');
  const [markingLoading, setMarkingLoading] = useState(false);

  const handleResetAttendance = async () => {
    try {
      setResetting(true);
      const res = await attendanceService.resetAttendance();
      toast.success(res.message || 'Attendance records reset successfully!');
      setResetModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset attendance');
    } finally {
      setResetting(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [attRes, subRes] = await Promise.all([
        attendanceService.getAttendance(),
        subjectService.getSubjects(),
      ]);
      setRecords(attRes.records || []);
      setSubjects(subRes.subjects || []);
      if (subRes.subjects?.length > 0 && !manualSubjectId) {
        setManualSubjectId(subRes.subjects[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load attendance logs.');
    } finally {
      setLoading(false);
    }
  }, [manualSubjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleManualMark = async (e) => {
    e.preventDefault();
    if (!manualSubjectId) {
      toast.error('Please select a subject');
      return;
    }
    try {
      setMarkingLoading(true);
      await attendanceService.markAttendance({
        subjectId: manualSubjectId,
        date: manualDate,
        status: manualStatus,
        notes: manualNotes.trim() || 'Manually logged',
      });
      toast.success(`Logged ${manualStatus} for ${manualDate}!`);
      setMarkModalOpen(false);
      setManualNotes('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record attendance');
    } finally {
      setMarkingLoading(false);
    }
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (selectedSubject !== 'ALL' && r.subjectId?._id !== selectedSubject) {
      return false;
    }
    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return <Badge variant="success">Present</Badge>;
      case 'Absent':
        return <Badge variant="danger">Absent</Badge>;
      case 'Pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'Cancelled':
      case 'Holiday':
        return <Badge variant="default">{status}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Attendance Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Attendance Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review your complete attendance history, monthly calendar, and modification logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle View Mode */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-dark-surface rounded-xl">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'history'
                  ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              History Log
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setLeaveModalOpen(true)}
            leftIcon={FileText}
            className="border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400"
          >
            Apply Leave / OD
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setResetModalOpen(true)}
            leftIcon={RotateCcw}
            className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            Reset Attendance
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setMarkModalOpen(true)}
            leftIcon={Plus}
          >
            Log Attendance
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Subject:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface px-3 py-1.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Subjects ({subjects.length})</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface px-3 py-1.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Holiday">Holiday</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 ml-auto font-medium">
          Showing {filteredRecords.length} records
        </span>
      </div>

      {/* VIEW MODE 1: MONTHLY CALENDAR */}
      {viewMode === 'calendar' && (
        <AttendanceCalendar
          records={filteredRecords}
          onSelectDate={(dateStr, dayRecords) => {
            setSelectedDateRecords({ date: dateStr, records: dayRecords });
          }}
        />
      )}

      {/* VIEW MODE 2: HISTORY TABLE */}
      {viewMode === 'history' && (
        <div className="bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border rounded-2xl overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Subject</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Class Timing</th>
                  <th className="px-6 py-3.5">History / Notes</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-300">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      No attendance records found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr
                      key={r._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-dark-surface/50 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-white">
                        {r.date}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: r.subjectId?.color || '#4F46E5' }}
                          />
                          <span className="font-semibold">{r.subjectId?.name || 'Class'}</span>
                          {r.subjectId?.code && (
                            <span className="font-mono text-[10px] text-slate-400">
                              ({r.subjectId.code})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">{getStatusBadge(r.status)}</td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {r.scheduledClassId
                          ? `${r.scheduledClassId.startTime} - ${r.scheduledClassId.endTime}`
                          : 'Manual Entry'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 truncate max-w-xs">
                        {r.notes ||
                          (r.changeHistory?.length > 0
                            ? `Modified ${r.changeHistory.length} times`
                            : '—')}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => setEditingRecord(r)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-surface"
                          title="Edit Status"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Date Inspection Modal (when a date is clicked on calendar) */}
      {selectedDateRecords && (
        <Modal
          isOpen={!!selectedDateRecords}
          onClose={() => setSelectedDateRecords(null)}
          title={`Attendance on ${selectedDateRecords.date}`}
          subtitle="All lectures recorded for this date"
        >
          <div className="space-y-3">
            {selectedDateRecords.records.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No attendance was marked for this date.
              </p>
            ) : (
              selectedDateRecords.records.map((r) => (
                <div
                  key={r._id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface flex items-center justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {r.subjectId?.name || 'Subject'}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {r.notes || `Recorded at ${new Date(r.markedAt).toLocaleTimeString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(r.status)}
                    <button
                      onClick={() => {
                        setEditingRecord(r);
                        setSelectedDateRecords(null);
                      }}
                      className="p-1 text-slate-400 hover:text-brand-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
            <div className="pt-2 text-right">
              <Button size="xs" variant="outline" onClick={() => setSelectedDateRecords(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Manual Mark Attendance Modal */}
      <Modal
        isOpen={markModalOpen}
        onClose={() => setMarkModalOpen(false)}
        title="Log Attendance Manually"
        subtitle="Mark attendance for past lectures or extra classes"
      >
        <form onSubmit={handleManualMark} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider block">
              Subject
            </label>
            <select
              value={manualSubjectId}
              onChange={(e) => setManualSubjectId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-sm px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500"
              required
            >
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Date"
            type="date"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            required
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider block">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Present', 'Absent', 'Pending'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setManualStatus(st)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    manualStatus === st
                      ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-dark-surface border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Notes / Reason (optional)"
            value={manualNotes}
            onChange={(e) => setManualNotes(e.target.value)}
            placeholder="e.g. Extra tutorial lecture attended"
          />

          <div className="pt-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setMarkModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={markingLoading}>
              Save Attendance
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Attendance Record Modal */}
      <EditAttendanceModal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
        onUpdated={loadData}
      />

      {/* Reset Attendance Confirmation Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset All Attendance Records"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to clear all your attendance records and start fresh?
          </p>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
            <p className="font-bold mb-0.5">✅ Your Timetable & Subjects are Safe</p>
            Your weekly schedule, subjects, rooms, and teachers are stored permanently in MongoDB and will <strong>NOT</strong> be deleted. Only attendance logs and percentages will be reset to 0%.
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-dark-border flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetModalOpen(false)}
              disabled={resetting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleResetAttendance}
              isLoading={resetting}
            >
              Yes, Reset Attendance
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Formal Leave / OD Application Modal */}
      <LeaveApplicationModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        subjects={subjects}
      />
    </div>
  );
};

export default AttendancePage;
