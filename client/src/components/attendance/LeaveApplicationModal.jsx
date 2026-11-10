import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Printer,
  Calendar,
  Building,
  User,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { attendanceService } from '../../services/attendanceService';
import toast from 'react-hot-toast';

const REASON_OPTIONS = [
  'Medical Leave / Illness',
  'On-Duty (OD) - Hackathon / Tech Fest',
  'On-Duty (OD) - College Sports Meet',
  'Family Emergency',
  'Academic Conference / Workshop',
  'Personal Unavoidable Circumstance',
];

const LeaveApplicationModal = ({ isOpen, onClose, subjects = [] }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [reasonType, setReasonType] = useState('Medical Leave / Illness');
  const [authorityTitle, setAuthorityTitle] = useState('The Head of Department');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [details, setDetails] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [copied, setCopied] = useState(false);

  // Toggle subject selection
  const toggleSubject = (name) => {
    if (selectedSubjects.includes(name)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== name));
    } else {
      setSelectedSubjects([...selectedSubjects, name]);
    }
  };

  const handleSelectAllSubjects = () => {
    if (selectedSubjects.length === subjects.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(subjects.map((s) => s.name));
    }
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!startDate) {
      toast.error('Please select a start date');
      return;
    }

    try {
      setGenerating(true);
      const res = await attendanceService.generateLeaveLetter({
        reasonType,
        authorityTitle,
        startDate,
        endDate: endDate || startDate,
        subjectNames: selectedSubjects.length > 0 ? selectedSubjects : subjects.map((s) => s.name),
        details: details.trim(),
      });

      if (res.success && res.letter) {
        setGeneratedLetter(res.letter);
        toast.success('AI Leave Application drafted!');
      } else {
        toast.error('Failed to draft application');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error generating letter with AI');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    toast.success('Copied formal application to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Formal Leave Application - AttendX</title>
          <style>
            body { font-family: 'Times New Roman', serif; line-height: 1.6; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 18px; text-align: center; margin-bottom: 25px; }
            pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; }
          </style>
        </head>
        <body>
          <pre>${generatedLetter}</pre>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleReset = () => {
    setGeneratedLetter('');
    setDetails('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>AI Leave & OD Application Generator</span>
        </div>
      }
      size="2xl"
    >
      {!generatedLetter ? (
        <form onSubmit={handleGenerate} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Need an official medical leave or On-Duty (OD) letter for attendance compensation? AttendX AI generates a strictly formatted, professional academic application customized to your college, course, and subjects.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Leave Type / Purpose
              </label>
              <select
                value={reasonType}
                onChange={(e) => setReasonType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Addressed To (Authority Title)"
              value={authorityTitle}
              onChange={(e) => setAuthorityTitle(e.target.value)}
              placeholder="e.g. The Head of Department"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date (Inclusive)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          {/* Subjects selection */}
          {subjects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Affected Classes / Subjects
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllSubjects}
                  className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {selectedSubjects.length === subjects.length ? 'Clear All' : 'Select All'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/40 max-h-28 overflow-y-auto">
                {subjects.map((sub) => {
                  const isChecked = selectedSubjects.includes(sub.name);
                  return (
                    <button
                      key={sub._id}
                      type="button"
                      onClick={() => toggleSubject(sub.name)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        isChecked
                          ? 'bg-brand-600 text-white border-brand-600 font-semibold shadow-xs'
                          : 'bg-white dark:bg-dark-card text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark-border hover:border-slate-300'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Specific Reason / Context (Optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="e.g. Diagnosed with acute viral fever (doctor prescription attached), or selected for Smart India Hackathon Grand Finale..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-dark-border">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={generating}
              leftIcon={Sparkles}
            >
              Draft Official Letter
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Official letter formatted and ready to submit to your department.</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleReset} leftIcon={RefreshCw}>
                Edit Details
              </Button>
            </div>
          </div>

          {/* Letter Preview Container */}
          <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-inner font-serif text-slate-800 dark:text-slate-200 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto selection:bg-indigo-100 dark:selection:bg-indigo-900">
            {generatedLetter}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-dark-border">
            <Button variant="ghost" onClick={onClose}>
              Done
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                leftIcon={Printer}
              >
                Print / Save PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCopy}
                leftIcon={copied ? Check : Copy}
              >
                {copied ? 'Copied!' : 'Copy Application'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default LeaveApplicationModal;
