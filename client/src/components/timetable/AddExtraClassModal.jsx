import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { formatDateISO } from '../../utils/dateUtils';
import { timetableService } from '../../services/timetableService';
import toast from 'react-hot-toast';

const AddExtraClassModal = ({ isOpen, onClose, subjects = [], onSaved }) => {
  const [subjectId, setSubjectId] = useState(subjects[0]?._id || '');
  const [date, setDate] = useState(formatDateISO());
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('12:00');
  const [room, setRoom] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subjectId) {
      toast.error('Please select a subject');
      return;
    }

    try {
      setLoading(true);
      // Determine day name for this specific date
      const dateObj = new Date(date);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const day = dayNames[dateObj.getDay()];

      await timetableService.createClass({
        subjectId,
        day,
        startTime,
        endTime,
        room,
        classType: 'Lecture',
        isTemporary: true,
        temporaryDate: date,
      });

      toast.success(`Extra class scheduled for ${date}!`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add extra class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Extra / Compensation Class"
      subtitle="Schedule a one-off class for a specific date without altering regular weekly timetable"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider block">
            Subject
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
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
          label="Specific Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
          <Input
            label="End Time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>

        <Input
          label="Room / Hall"
          type="text"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="e.g. Audi 1 or Lab 2"
        />

        <div className="pt-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={loading}>
            Add Extra Class
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddExtraClassModal;
