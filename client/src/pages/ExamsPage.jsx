import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertTriangle,
  Award,
  BookOpen,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { examService } from '../services/examService';
import { subjectService } from '../services/subjectService';
import toast from 'react-hot-toast';

const EXAM_TYPES = ['Mid-Term', 'End-Term', 'Quiz', 'Lab Viva', 'Practical', 'Class Test'];

const ExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subjectId: '',
    examType: 'Mid-Term',
    examDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '12:00',
    room: '',
    totalMarks: 100,
    syllabusTopicsInput: '',
    status: 'Upcoming',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [eRes, sRes] = await Promise.all([
        examService.getExams({ status: statusFilter }),
        subjectService.getSubjects(),
      ]);
      setExams(eRes.exams || []);
      setSubjects(sRes.subjects || []);
      if (sRes.subjects?.length > 0 && !formData.subjectId) {
        setFormData((prev) => ({ ...prev, subjectId: sRes.subjects[0]._id }));
      }
    } catch (err) {
      toast.error('Failed to load examinations');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (exam = null) => {
    if (exam) {
      setEditingExam(exam);
      setFormData({
        title: exam.title,
        subjectId: exam.subjectId?._id || exam.subjectId,
        examType: exam.examType,
        examDate: exam.examDate,
        startTime: exam.startTime,
        endTime: exam.endTime,
        room: exam.room || '',
        totalMarks: exam.totalMarks || 100,
        syllabusTopicsInput: (exam.syllabusTopics || []).join(', '),
        status: exam.status,
      });
    } else {
      setEditingExam(null);
      setFormData({
        title: '',
        subjectId: subjects[0]?._id || '',
        examType: 'Mid-Term',
        examDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '12:00',
        room: '',
        totalMarks: 100,
        syllabusTopicsInput: '',
        status: 'Upcoming',
      });
    }
    setModalOpen(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter exam title');
      return;
    }
    if (!formData.subjectId) {
      toast.error('Please select a subject');
      return;
    }

    const payload = {
      ...formData,
      syllabusTopics: formData.syllabusTopicsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    };

    try {
      setSaving(true);
      if (editingExam) {
        await examService.updateExam(editingExam._id, payload);
        toast.success('Exam details updated!');
      } else {
        await examService.createExam(payload);
        toast.success('Exam scheduled!');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this examination entry?')) return;
    try {
      await examService.deleteExam(id);
      toast.success('Exam entry removed');
      loadData();
    } catch (err) {
      toast.error('Failed to delete exam');
    }
  };

  // Find nearest upcoming exam
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingExams = exams.filter((e) => e.status === 'Upcoming' && e.examDate >= todayStr);
  const nextExam = upcomingExams.length > 0 ? upcomingExams[0] : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Assessment Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Examinations & Vivas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track Mid-Terms, End-Terms, practical lab vivas, and classroom quizzes with room & syllabus details.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={() => handleOpenModal()} leftIcon={Plus}>
          Schedule Exam
        </Button>
      </div>

      {/* Nearest Upcoming Exam Hero Banner */}
      {nextExam && (
        <Card className="p-6 bg-gradient-to-r from-brand-900/10 via-indigo-900/10 to-transparent border-brand-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-600 text-white shadow-xs">
                  Next Exam Ahead
                </span>
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                  {nextExam.examType}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {nextExam.title} ({nextExam.subjectId?.name || 'Subject'})
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  {nextExam.examDate}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {nextExam.startTime} - {nextExam.endTime}
                </span>
                {nextExam.room && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {nextExam.room}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  {nextExam.totalMarks} Marks
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenModal(nextExam)}
              leftIcon={Edit2}
            >
              Edit Details
            </Button>
          </div>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-dark-border pb-3">
        {['ALL', 'Upcoming', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === tab
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-surface'
            }`}
          >
            {tab === 'ALL' ? 'All Examinations' : tab}
          </button>
        ))}
      </div>

      {/* Exams Grid */}
      {exams.length === 0 ? (
        <Card className="text-center py-12 space-y-3">
          <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No examinations scheduled
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add your upcoming Mid-Term dates, quiz schedules, or practical vivas to receive timely alerts.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <Card key={exam._id} className="p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-surface text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-border">
                    {exam.examType}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(exam)}
                      className="p-1 text-slate-400 hover:text-brand-600 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(exam._id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {exam.title}
                </h3>
                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
                  {exam.subjectId?.name || 'General Course'} {exam.subjectId?.code ? `(${exam.subjectId.code})` : ''}
                </p>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.examDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.startTime} – {exam.endTime}</span>
                  </div>
                  {exam.room && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.room}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>Max Marks: {exam.totalMarks}</span>
                  </div>
                </div>

                {exam.syllabusTopics && exam.syllabusTopics.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-dark-border">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Syllabus Topics
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {exam.syllabusTopics.map((topic, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-surface text-slate-600 dark:text-slate-300"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    exam.status === 'Completed'
                      ? 'bg-slate-100 text-slate-500 dark:bg-dark-surface'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {exam.status}
                </span>
                <button
                  onClick={async () => {
                    const nextSt = exam.status === 'Upcoming' ? 'Completed' : 'Upcoming';
                    await examService.updateExam(exam._id, { status: nextSt });
                    loadData();
                  }}
                  className="text-xs text-brand-600 hover:underline font-semibold"
                >
                  Mark {exam.status === 'Upcoming' ? 'Completed' : 'Upcoming'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Exam Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingExam ? 'Edit Examination' : 'Schedule Examination'}
        size="md"
      >
        <form onSubmit={handleSaveExam} className="space-y-4">
          <Input
            label="Exam Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Mid-Semester Written Examination"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Subject Course *
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 bg-slate-50 dark:bg-dark-surface text-slate-900 dark:text-white"
                required
              >
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.code ? `(${s.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Exam Type
              </label>
              <select
                value={formData.examType}
                onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 bg-slate-50 dark:bg-dark-surface text-slate-900 dark:text-white"
              >
                {EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Date *"
              type="date"
              value={formData.examDate}
              onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
              required
            />
            <Input
              label="Start Time"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
            <Input
              label="End Time"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Room / Hall"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              placeholder="e.g. Auditorium / LH-101"
            />
            <Input
              label="Total Marks"
              type="number"
              value={formData.totalMarks}
              onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Syllabus Topics (comma-separated)"
            value={formData.syllabusTopicsInput}
            onChange={(e) => setFormData({ ...formData, syllabusTopicsInput: e.target.value })}
            placeholder="e.g. Trees, Graphs, Sorting, Dynamic Programming"
          />

          <div className="pt-3 border-t border-slate-100 dark:border-dark-border flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={saving}>
              {editingExam ? 'Update Exam' : 'Schedule Exam'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExamsPage;
