import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { attendanceService } from '../../services/attendanceService';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Present', 'Absent', 'Pending', 'Cancelled', 'Holiday'];

const EditAttendanceModal = ({ isOpen, onClose, record, onUpdated }) => {
  const [status, setStatus] = useState('Present');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record) {
      setStatus(record.status || 'Present');
      setReason('');
    }
  }, [record, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!record?._id) return;

    try {
      setLoading(true);
      await attendanceService.updateAttendance(record._id, {
        status,
        reason: reason.trim() || 'Manual modification',
      });
      toast.success('Attendance record updated and audit log saved.');
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update record');
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Attendance Record"
      subtitle={`${record.subjectId?.name || 'Class'} • ${record.date}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider block">
            Attendance Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  status === st
                    ? st === 'Present'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : st === 'Absent'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-brand-600 text-white border-brand-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-dark-surface border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Reason for Modification"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Teacher corrected roll call / Attendance on medical leave"
          required
        />

        {/* Change History Log display */}
        {record.changeHistory && record.changeHistory.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Change History ({record.changeHistory.length})
            </span>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {record.changeHistory.map((h, idx) => (
                <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {h.previousStatus} → {h.newStatus}
                  </span>{' '}
                  ({new Date(h.changedAt).toLocaleDateString()}) : {h.reason || 'No reason'}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={loading}>
            Save Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditAttendanceModal;
