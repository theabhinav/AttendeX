import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Check,
  X,
  Users,
  ClipboardList,
} from 'lucide-react';
import Button from '../common/Button';
import { timetableService } from '../../services/timetableService';
import toast from 'react-hot-toast';

const SAMPLE_TEXT_TIMETABLE = `Monday:
09:00 - 10:00: CS201 Data Structures & Algorithms - LH-101 - Dr. Vance
10:15 - 11:15: CS204 Database Management Systems - Room 204 - Prof. Sharma
11:30 - 12:30: CS205 Computer Networks - LH-102
02:00 - 04:00: G1: CS201P Data Structures Lab - Lab 3 / G2: CS204P DBMS Lab - Lab 1

Tuesday:
09:00 - 10:00: MA201 Discrete Mathematics - Room 305
10:15 - 11:15: CS202 Operating Systems - LH-101
02:00 - 04:00: G1: CS204P Database Lab - DB Lab 1 / G2: CS201P DSA Lab - Lab 3

Wednesday:
09:00 - 10:00: CS201 Data Structures - LH-101
10:15 - 11:15: CS205 Computer Networks - LH-102

Thursday:
09:00 - 10:00: CS202 Operating Systems - LH-101
10:15 - 11:15: CS204 Database Management - Room 204
02:00 - 04:00: G1: CS202P OS Lab - OS Lab 2 / G2: CS205P Networks Lab - Lab 4

Friday:
09:00 - 10:00: MA201 Discrete Mathematics - Room 305
10:15 - 11:15: CS201 Data Structures - LH-101`;

const QUICK_GROUPS = [
  { label: 'All Classes', value: '' },
  { label: 'Group 1 (G1)', value: 'Group 1' },
  { label: 'Group 2 (G2)', value: 'Group 2' },
  { label: 'Batch A', value: 'Batch A' },
  { label: 'Batch B', value: 'Batch B' },
];

const TimetableUploader = ({ onExtracted }) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'text'

  // Student Group / Batch state
  const [studentGroup, setStudentGroup] = useState('');

  // Upload state
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scanStep, setScanStep] = useState('');

  // Paste text state
  const [pastedText, setPastedText] = useState('');
  const [parsingText, setParsingText] = useState(false);

  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please upload a JPG, JPEG, PNG, WEBP or PDF document.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setScanStep('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScan = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(20);
      setScanStep('Analyzing timetable document structure...');

      const formData = new FormData();
      formData.append('file', file);
      if (studentGroup.trim()) {
        formData.append('studentGroup', studentGroup.trim());
      }

      const t1 = setTimeout(() => {
        setUploadProgress(50);
        setScanStep('Extracting subjects, room numbers, faculty, and timings...');
      }, 1500);

      const t2 = setTimeout(() => {
        setUploadProgress(80);
        setScanStep(
          studentGroup.trim()
            ? `Filtering sessions for ${studentGroup.trim()} & building schedule...`
            : 'Structuring weekly schedule...'
        );
      }, 3200);

      const res = await timetableService.scanTimetableFile(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 30) / progressEvent.total);
          setUploadProgress((p) => Math.max(p, percent));
        }
      });

      clearTimeout(t1);
      clearTimeout(t2);

      setUploadProgress(100);
      setScanStep('Extraction complete!');
      toast.success(
        res.data?.extractionEngine
          ? `Extracted via ${res.data.extractionEngine}!`
          : 'Timetable extracted! Verify below.'
      );

      onExtracted(res.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to extract timetable.');
    } finally {
      setUploading(false);
    }
  };

  const handleParseText = async () => {
    if (!pastedText.trim()) {
      toast.error('Please paste your timetable text first.');
      return;
    }

    try {
      setParsingText(true);
      const res = await timetableService.parseTimetableText(pastedText, studentGroup);
      if (!res.data?.subjects || res.data.subjects.length === 0) {
        toast.error('No classes recognized in pasted text. Ensure it contains Days (e.g. Monday) and Times (e.g. 09:00 - 10:00).');
        return;
      }
      toast.success(`Successfully extracted ${res.data.subjects.length} subjects!`);
      onExtracted(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to parse timetable text');
    } finally {
      setParsingText(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-subtle space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-dark-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              AI Timetable Scanner
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Upload your college timetable image, photo, or PDF. We extract every classroom, faculty name, timing, and course code automatically.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Vision AI Ready</span>
        </div>
      </div>

      {/* Student Group / Batch Selector (Crucial for split lab/tutorial batches) */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-surface border border-slate-200/80 dark:border-dark-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Your Batch / Group (Optional)</span>
          </label>
          <span className="text-[11px] text-slate-500">
            Filters labs & tutorials to only your group
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={studentGroup}
            onChange={(e) => setStudentGroup(e.target.value)}
            placeholder="e.g. Group 1, G1, Batch A (or leave empty for all classes)"
            className="flex-1 text-xs rounded-xl border border-slate-200 dark:border-dark-border px-3.5 py-2.5 bg-white dark:bg-dark-card text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-400"
          />
          {studentGroup && (
            <button
              type="button"
              onClick={() => setStudentGroup('')}
              className="px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 self-center"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick select chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-medium text-slate-400 mr-1">Quick Select:</span>
          {QUICK_GROUPS.map((grp) => {
            const isSelected =
              (grp.value === '' && !studentGroup) ||
              (grp.value !== '' && studentGroup.toLowerCase() === grp.value.toLowerCase());
            return (
              <button
                key={grp.label}
                type="button"
                onClick={() => setStudentGroup(grp.value)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white dark:bg-dark-card text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-surface'
                }`}
              >
                {grp.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs: Upload Document vs Paste Text */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-dark-border pb-3">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'upload'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-surface'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Image / PDF</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'text'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-surface'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Paste Timetable Text</span>
        </button>
      </div>

      {/* TAB 1: UPLOAD DOCUMENT */}
      {activeTab === 'upload' && (
        <>
          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 scale-[0.99]'
                  : 'border-slate-300 dark:border-dark-border hover:border-brand-400 dark:hover:border-brand-600 hover:bg-slate-50/50 dark:hover:bg-dark-surface/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleChange}
              />
              <div className="h-14 w-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Click to upload or drag & drop your timetable here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPG, JPEG, PNG, WEBP, or PDF (up to 10MB)
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-3 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Camera photos, scanned papers, ERP screenshots, or PDF documents</span>
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-dark-border rounded-2xl p-5 bg-slate-50 dark:bg-dark-surface">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border flex items-center justify-center shrink-0">
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="w-6 h-6 text-brand-600" />
                    ) : (
                      <FileText className="w-6 h-6 text-rose-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClear}
                  disabled={uploading}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {previewUrl && (
                <div className="mt-4 max-h-72 rounded-xl overflow-hidden border border-slate-200 dark:border-dark-border bg-slate-900/5">
                  <img
                    src={previewUrl}
                    alt="Timetable Preview"
                    className="w-full h-full object-contain max-h-72 mx-auto"
                  />
                </div>
              )}

              {uploading && (
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>{scanStep || 'Extracting timetable...'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-600 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-3">
                <Button variant="outline" size="sm" onClick={handleClear} disabled={uploading}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleScan}
                  isLoading={uploading}
                  rightIcon={Sparkles}
                >
                  {studentGroup.trim()
                    ? `Extract Timetable for ${studentGroup.trim()}`
                    : 'Scan & Extract Timetable'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: PASTE TEXT */}
      {activeTab === 'text' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Paste Raw Timetable Text / Portal Export
            </label>
            <button
              type="button"
              onClick={() => setPastedText(SAMPLE_TEXT_TIMETABLE)}
              className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              Fill Sample Schedule
            </button>
          </div>

          <textarea
            rows={8}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={`Paste your timetable here, e.g.:
Monday:
09:00 - 10:00: CS201 Data Structures (LH-1)
10:15 - 11:15: CS204 Database Management (Room 204)
02:00 - 04:00: G1: CS201 Lab`}
            className="w-full text-xs font-mono rounded-2xl border border-slate-200 dark:border-dark-border p-4 bg-slate-50 dark:bg-dark-surface text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Instantly detects days, hours, courses, and applies your group filter.
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleParseText}
              isLoading={parsingText}
              rightIcon={Check}
            >
              {studentGroup.trim()
                ? `Parse Text for ${studentGroup.trim()}`
                : 'Parse Timetable Text'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableUploader;
