import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  MapPin,
  User,
  Sparkles,
  Edit3,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { DAYS_OF_WEEK } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CLASS_TYPES = ['Lecture', 'Tutorial', 'Practical', 'Lab', 'Seminar', 'Other'];

const AIPreviewVerification = ({
  extractedData,
  onConfirm,
  onCancel,
  confirming = false,
}) => {
  const [subjects, setSubjects] = useState(() => extractedData?.subjects || []);
  const [isEditing, setIsEditing] = useState(true);

  // Subject Modification Helpers
  const handleSubjectChange = (sIdx, field, value) => {
    setSubjects((prev) => {
      const copy = [...prev];
      copy[sIdx] = { ...copy[sIdx], [field]: value };
      return copy;
    });
  };

  const handleAddSubject = () => {
    setSubjects((prev) => [
      ...prev,
      {
        name: 'New Subject',
        code: '',
        faculty: '',
        classes: [
          {
            day: 'Monday',
            startTime: '09:00',
            endTime: '10:00',
            room: '',
            type: 'Lecture',
            confidence: { name: 1, timing: 1, room: 1 },
          },
        ],
      },
    ]);
  };

  const handleRemoveSubject = (sIdx) => {
    setSubjects((prev) => prev.filter((_, idx) => idx !== sIdx));
  };

  // Class Slot Modification Helpers
  const handleClassChange = (sIdx, cIdx, field, value) => {
    setSubjects((prev) => {
      const copy = [...prev];
      const classesCopy = [...copy[sIdx].classes];
      classesCopy[cIdx] = { ...classesCopy[cIdx], [field]: value };
      copy[sIdx].classes = classesCopy;
      return copy;
    });
  };

  const handleAddClass = (sIdx) => {
    setSubjects((prev) => {
      const copy = [...prev];
      const classesCopy = [
        ...(copy[sIdx].classes || []),
        {
          day: 'Monday',
          startTime: '10:00',
          endTime: '11:00',
          room: '',
          type: 'Lecture',
          confidence: { name: 1, timing: 1, room: 1 },
        },
      ];
      copy[sIdx].classes = classesCopy;
      return copy;
    });
  };

  const handleRemoveClass = (sIdx, cIdx) => {
    setSubjects((prev) => {
      const copy = [...prev];
      copy[sIdx].classes = copy[sIdx].classes.filter((_, idx) => idx !== cIdx);
      return copy;
    });
  };

  const handleConfirmActivation = () => {
    if (subjects.length === 0) {
      toast.error('Please keep at least one subject in the timetable.');
      return;
    }
    // Call parent handler to save to database
    onConfirm(subjects);
  };

  return (
    <div className="bg-white dark:bg-dark-card border-2 border-brand-500/30 rounded-3xl p-6 sm:p-8 shadow-xl animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-dark-border gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-brand-500 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              Verification Required
            </span>
            {extractedData?.extractionEngine && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {extractedData.extractionEngine}
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Verify AI-Extracted Timetable
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Carefully inspect the extracted courses, days, and times below. You can edit any field before activating.
          </p>
        </div>

        {/* Action Buttons: Edit / Confirm & Activate */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            leftIcon={Edit3}
          >
            {isEditing ? 'Compact Preview' : 'Edit Timetable'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirmActivation}
            isLoading={confirming}
            rightIcon={CheckCircle2}
          >
            Confirm & Activate
          </Button>
        </div>
      </div>

      {/* Warnings & Institution detected */}
      {extractedData?.warningNotice && (
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{extractedData.warningNotice}</span>
        </div>
      )}

      {/* Subjects & Slots List */}
      <div className="mt-6 space-y-6">
        {subjects.map((sub, sIdx) => (
          <div
            key={sIdx}
            className="p-5 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/60 dark:bg-dark-surface/60 space-y-4"
          >
            {/* Subject Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-dark-border">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    value={sub.name}
                    onChange={(e) => handleSubjectChange(sIdx, 'name', e.target.value)}
                    className="w-full text-sm font-bold bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-brand-500"
                    placeholder="Subject Name"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    value={sub.code || ''}
                    onChange={(e) => handleSubjectChange(sIdx, 'code', e.target.value)}
                    className="w-full text-xs font-mono uppercase bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. CS201"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Faculty (Optional)
                  </label>
                  <input
                    type="text"
                    value={sub.faculty || ''}
                    onChange={(e) => handleSubjectChange(sIdx, 'faculty', e.target.value)}
                    className="w-full text-xs bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-brand-500"
                    placeholder="Instructor Name"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleAddClass(sIdx)}
                  leftIcon={Plus}
                >
                  Add Class Slot
                </Button>
                <button
                  onClick={() => handleRemoveSubject(sIdx)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                  title="Remove subject"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Classes for this subject */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Scheduled Weekly Sessions ({sub.classes?.length || 0})
              </span>

              <div className="grid grid-cols-1 gap-2.5">
                {(sub.classes || []).map((cls, cIdx) => {
                  const isLowConfidence =
                    cls.confidence &&
                    (cls.confidence.timing < 0.85 || cls.confidence.room < 0.8);

                  return (
                    <div
                      key={cIdx}
                      className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${
                        isLowConfidence
                          ? 'bg-amber-500/5 border-amber-400 dark:border-amber-600'
                          : 'bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border'
                      }`}
                    >
                      {/* Day select */}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={cls.day}
                          onChange={(e) => handleClassChange(sIdx, cIdx, 'day', e.target.value)}
                          className="font-bold bg-transparent border-0 text-slate-900 dark:text-white focus:ring-0 p-0 cursor-pointer"
                        >
                          {VALID_DAYS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Timings */}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-brand-500" />
                        <input
                          type="time"
                          value={cls.startTime}
                          onChange={(e) =>
                            handleClassChange(sIdx, cIdx, 'startTime', e.target.value)
                          }
                          className="bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded px-1.5 py-0.5 text-xs font-semibold"
                        />
                        <span>-</span>
                        <input
                          type="time"
                          value={cls.endTime}
                          onChange={(e) =>
                            handleClassChange(sIdx, cIdx, 'endTime', e.target.value)
                          }
                          className="bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded px-1.5 py-0.5 text-xs font-semibold"
                        />
                      </div>

                      {/* Room */}
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={cls.room || ''}
                          onChange={(e) => handleClassChange(sIdx, cIdx, 'room', e.target.value)}
                          placeholder="Room / Lab"
                          className="w-24 bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded px-2 py-0.5 text-xs"
                        />
                      </div>

                      {/* Type */}
                      <div>
                        <select
                          value={cls.type}
                          onChange={(e) => handleClassChange(sIdx, cIdx, 'type', e.target.value)}
                          className="bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded px-2 py-0.5 text-xs font-semibold"
                        >
                          {CLASS_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Low confidence tag */}
                      {isLowConfidence && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-200">
                          Check Timings
                        </span>
                      )}

                      {/* Remove slot */}
                      <button
                        onClick={() => handleRemoveClass(sIdx, cIdx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="Delete slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="sm" onClick={handleAddSubject} leftIcon={Plus}>
            Add Another Subject
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Discard Extraction
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmActivation}
              isLoading={confirming}
              rightIcon={CheckCircle2}
            >
              Confirm & Activate Timetable
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPreviewVerification;
