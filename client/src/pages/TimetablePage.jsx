import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  Sparkles,
  Upload,
  Plus,
  Download,
  FileCode,
  CheckCircle2,
  RefreshCw,
  Clock,
  Layers,
  Calendar,
} from 'lucide-react';
import { timetableService } from '../services/timetableService';
import { subjectService } from '../services/subjectService';
import TimetableUploader from '../components/timetable/TimetableUploader';
import AIPreviewVerification from '../components/timetable/AIPreviewVerification';
import WeeklyTimetableGrid from '../components/timetable/WeeklyTimetableGrid';
import ManualClassModal from '../components/timetable/ManualClassModal';
import AddExtraClassModal from '../components/timetable/AddExtraClassModal';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const TimetablePage = () => {
  const [timetable, setTimetable] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Extraction State
  const [extractedData, setExtractedData] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  // Manual Modals State
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [extraClassModalOpen, setExtraClassModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, sRes] = await Promise.all([
        timetableService.getTimetable(),
        subjectService.getSubjects(),
      ]);
      setTimetable(tRes.timetable || []);
      setSubjects(sRes.subjects || []);
    } catch (err) {
      console.error('Error loading timetable data:', err);
      toast.error('Failed to load timetable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle AI Extracted response
  const handleAIExtracted = (data) => {
    setExtractedData(data);
    setShowUploader(false);
  };

  // Confirm and activate AI extracted timetable
  const handleConfirmTimetable = async (verifiedSubjects) => {
    try {
      setConfirming(true);
      await timetableService.confirmTimetable({
        subjects: verifiedSubjects,
        replaceExisting: true,
      });
      toast.success('Timetable activated successfully!');
      setExtractedData(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate timetable');
    } finally {
      setConfirming(false);
    }
  };

  // Delete a class slot
  const handleDeleteClass = async (id) => {
    if (!window.confirm('Are you sure you want to remove this class from your timetable?')) {
      return;
    }
    try {
      await timetableService.deleteClass(id);
      toast.success('Class removed');
      loadData();
    } catch (err) {
      toast.error('Failed to delete class');
    }
  };

  // Export Timetable to JSON file
  const handleExport = async () => {
    try {
      const res = await timetableService.exportTimetable();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `attendx_timetable_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Timetable exported successfully!');
    } catch (err) {
      toast.error('Failed to export timetable');
    }
  };

  // Sync to Google Calendar / Apple Calendar (.ics export)
  const handleExportICS = async () => {
    try {
      toast.loading('Generating Calendar sync file (.ics)...', { id: 'ics-toast' });
      await timetableService.downloadICS();
      toast.success('Downloaded attendx_timetable.ics! Double-click to sync with Google Calendar or Apple iCal.', { id: 'ics-toast' });
    } catch (err) {
      toast.error('Failed to export calendar', { id: 'ics-toast' });
    }
  };

  // Import Timetable from JSON file
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        await timetableService.importTimetable({ timetableJson: json, replaceExisting: false });
        toast.success('Timetable imported successfully!');
        loadData();
      } catch (err) {
        toast.error('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">
            <CalendarDays className="w-4 h-4" />
            <span>Academic Schedule Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            My Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {timetable.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Permanently saved in database: {timetable.length} weekly classes across {subjects.length} subjects</span>
              </span>
            ) : (
              'Scan your timetable document with AI or customize your weekly slots manually.'
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportICS}
            leftIcon={Calendar}
            title="Sync classes into Google Calendar / Apple Calendar"
          >
            Sync Calendar (.ics)
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            leftIcon={Download}
            title="Export Timetable JSON"
          >
            Export JSON
          </Button>

          <label className="cursor-pointer">
            <span className="inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 border border-slate-300 dark:border-dark-border bg-transparent hover:bg-slate-50 dark:hover:bg-dark-surface text-slate-700 dark:text-slate-300 text-sm px-3.5 py-2 gap-1.5">
              <FileCode className="w-4 h-4" />
              <span>Import JSON</span>
            </span>
            <input type="file" accept=".json" className="hidden" onChange={handleImportFile} />
          </label>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setExtraClassModalOpen(true)}
            leftIcon={Clock}
          >
            Add Extra Class
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setShowUploader(!showUploader);
              setExtractedData(null);
            }}
            leftIcon={Sparkles}
          >
            {showUploader ? 'Close Scanner' : 'AI Timetable Scanner'}
          </Button>
        </div>
      </div>

      {/* AI Timetable Scanner Section (Option A) */}
      {showUploader && !extractedData && (
        <TimetableUploader onExtracted={handleAIExtracted} />
      )}

      {/* AI Extracted Verification Section (Mandatory Verification UI) */}
      {extractedData && (
        <AIPreviewVerification
          extractedData={extractedData}
          onConfirm={handleConfirmTimetable}
          onCancel={() => setExtractedData(null)}
          confirming={confirming}
        />
      )}

      {/* Active Timetable Display (Weekly & Daily Grid) */}
      <WeeklyTimetableGrid
        timetable={timetable}
        subjects={subjects}
        onEditClass={(slot) => {
          setEditingSlot(slot);
          setManualModalOpen(true);
        }}
        onDeleteClass={handleDeleteClass}
        onAddClass={() => {
          setEditingSlot(null);
          setManualModalOpen(true);
        }}
        onAddDateException={() => setExtraClassModalOpen(true)}
      />

      {/* Manual Class Modal (Option B) */}
      <ManualClassModal
        isOpen={manualModalOpen}
        onClose={() => {
          setManualModalOpen(false);
          setEditingSlot(null);
        }}
        initialData={editingSlot}
        subjects={subjects}
        onSaved={loadData}
      />

      {/* Add Extra Class Modal */}
      <AddExtraClassModal
        isOpen={extraClassModalOpen}
        onClose={() => setExtraClassModalOpen(false)}
        subjects={subjects}
        onSaved={loadData}
      />
    </div>
  );
};

export default TimetablePage;
