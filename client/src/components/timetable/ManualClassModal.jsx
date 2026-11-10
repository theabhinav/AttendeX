import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { DAYS_OF_WEEK } from '../../utils/dateUtils';
import { subjectService } from '../../services/subjectService';
import { timetableService } from '../../services/timetableService';
import toast from 'react-hot-toast';

const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CLASS_TYPES = ['Lecture', 'Tutorial', 'Practical', 'Lab', 'Seminar', 'Other'];

const ManualClassModal = ({
  isOpen,
  onClose,
  initialData = null,
  subjects = [],
  onSaved,
}) => {
  const [subjectId, setSubjectId] = useState('');
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('');
  const [faculty, setFaculty] = useState('');
  const [classType, setClassType] = useState('Lecture');

  // Option to create new subject directly
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSubjectId(initialData.subjectId?._id || initialData.subjectId || '');
      setDay(initialData.day || 'Monday');
      setStartTime(initialData.startTime || '09:00');
      setEndTime(initialData.endTime || '10:00');
      setRoom(initialData.room || '');
      setFaculty(initialData.faculty || '');
      setClassType(initialData.classType || 'Lecture');
    } else {
      setSubjectId(subjects[0]?._id || '');
      setDay('Monday');
      setStartTime('09:00');
      setEndTime('10:00');
      setRoom('');
      setFaculty('');
      setClassType('Lecture');
      setIsCreatingSubject(false);
    }
  }, [initialData, subjects, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let targetSubjectId = subjectId;

    try {
      setLoading(true);

      // Create new subject if toggle is on
      if (isCreatingSubject) {
        if (!newSubjectName.trim()) {
          toast.error('Please enter the subject name');
          setLoading(false);
          return;
        }
        const createdSub = await subjectService.createSubject({
          name: newSubjectName.trim(),
          code: newSubjectCode.trim(),
          faculty: faculty.trim(),
        });
        targetSubjectId = createdSub.subject._id;
      }

      if (!targetSubjectId) {
        toast.error('Please select or create a subject');
        setLoading(false);
        return;
      }

      const payload = {
        subjectId: targetSubjectId,
        day,
        startTime,
        endTime,
        room,
        faculty,
        classType,
      };

      if (initialData?._id) {
        await timetableService.updateClass(initialData._id, payload);
        toast.success('Class slot updated successfully!');
      } else {
        await timetableService.createClass(payload);
        toast.success('Class slot added to timetable!');
      }

      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save class slot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Class Slot' : 'Add Class to Timetable'}
      subtitle="Configure subject, timing, and classroom details"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject Selection / Creation */}
        {!isCreatingSubject ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Subject
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingSubject(true)}
                className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
              >
                + New Subject
              </button>
            </div>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-sm px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500"
              required
            >
              <option value="" disabled>
                Select a subject
              </option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="p-3 bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-700 dark:text-brand-300">
                Create New Subject
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingSubject(false)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </button>
            </div>
            <Input
              label="Subject Name"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="e.g. Distributed Systems"
              required
            />
            <Input
              label="Subject Code"
              value={newSubjectCode}
              onChange={(e) => setNewSubjectCode(e.target.value)}
              placeholder="e.g. CS401"
            />
          </div>
        )}

        {/* Day of Week */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider block">
            Day of Week
          </label>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-sm px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500"
          >
            {VALID_DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Timings */}
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

        {/* Room & Class Type */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Room / Lab"
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="e.g. LH-2 or Lab 4"
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider block">
              Type
            </label>
            <select
              value={classType}
              onChange={(e) => setClassType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-sm px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500"
            >
              {CLASS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Faculty / Professor"
          type="text"
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          placeholder="Instructor Name"
        />

        <div className="pt-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={loading}>
            {initialData ? 'Save Changes' : 'Add to Timetable'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ManualClassModal;
