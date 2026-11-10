import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Filter,
  Search,
  Sparkles,
  Mic,
  ArrowUpDown,
  ListTodo,
  TrendingUp,
  FolderOpen,
  Code,
  GraduationCap,
  Briefcase,
  User,
  MoreVertical,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import ProgressBar from '../components/common/ProgressBar';
import VoiceAssistantModal from '../components/voice/VoiceAssistantModal';
import { taskService } from '../services/taskService';
import { subjectService } from '../services/subjectService';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Academics',
  'Assignments',
  'Coding / DSA',
  'Projects',
  'Exams',
  'Personal',
  'Other',
];

const PRIORITIES = ['High', 'Medium', 'Low'];

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Coding / DSA':
      return <Code className="w-3.5 h-3.5" />;
    case 'Exams':
      return <GraduationCap className="w-3.5 h-3.5" />;
    case 'Projects':
      return <Briefcase className="w-3.5 h-3.5" />;
    case 'Personal':
      return <User className="w-3.5 h-3.5" />;
    default:
      return <Tag className="w-3.5 h-3.5" />;
  }
};

const TodoPage = () => {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Controls
  const [statusTab, setStatusTab] = useState('all'); // 'all' | 'today' | 'upcoming' | 'completed' | 'overdue'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('dueDate_asc');

  // Quick Add Input
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('Academics');
  const [quickPriority, setQuickPriority] = useState('Medium');
  const [quickAdding, setQuickAdding] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [savingTask, setSavingTask] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Modal Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Academics',
    priority: 'Medium',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '',
    subjectId: '',
    reminderEnabled: true,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksRes, summaryRes, subjectsRes] = await Promise.all([
        taskService.getTasks({
          status: statusTab,
          category: selectedCategory,
          priority: selectedPriority,
          search: searchQuery,
          sort: sortBy,
        }),
        taskService.getSummary(),
        subjectService.getSubjects(),
      ]);

      setTasks(tasksRes.tasks || []);
      setSummary(summaryRes.summary || null);
      setSubjects(subjectsRes.subjects || []);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [statusTab, selectedCategory, selectedPriority, searchQuery, sortBy]);

  useEffect(() => {
    loadData();

    const handleTaskUpdated = () => {
      loadData();
    };

    window.addEventListener('attendx:task-updated', handleTaskUpdated);
    return () => {
      window.removeEventListener('attendx:task-updated', handleTaskUpdated);
    };
  }, [loadData]);

  // Quick Add Task
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    try {
      setQuickAdding(true);
      await taskService.createTask({
        title: quickTitle.trim(),
        category: quickCategory,
        priority: quickPriority,
        dueDate: statusTab === 'today' ? new Date().toISOString().split('T')[0] : null,
      });
      setQuickTitle('');
      toast.success('Task added!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add task');
    } finally {
      setQuickAdding(false);
    }
  };

  // Toggle Task Completion
  const handleToggle = async (task) => {
    try {
      await taskService.toggleTask(task._id);
      loadData();
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  // Delete Task
  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskService.deleteTask(taskId);
      toast.success('Task removed');
      loadData();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  // Bulk Clear Completed
  const handleClearCompleted = async () => {
    if (!window.confirm('Delete all completed tasks?')) return;
    try {
      const res = await taskService.clearCompleted();
      toast.success(res.message || 'Cleared completed tasks');
      loadData();
    } catch (err) {
      toast.error('Failed to clear completed tasks');
    }
  };

  // Open Add/Edit Modal
  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate || '',
        dueTime: task.dueTime || '',
        subjectId: task.subjectId || '',
        reminderEnabled: task.reminderEnabled ?? true,
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        category: selectedCategory !== 'ALL' ? selectedCategory : 'Academics',
        priority: 'Medium',
        dueDate: statusTab === 'today' ? new Date().toISOString().split('T')[0] : '',
        dueTime: '',
        subjectId: '',
        reminderEnabled: true,
      });
    }
    setModalOpen(true);
  };

  // Save Modal Task
  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      setSavingTask(true);
      if (editingTask) {
        await taskService.updateTask(editingTask._id, formData);
        toast.success('Task updated!');
      } else {
        await taskService.createTask(formData);
        toast.success('Task created!');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSavingTask(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header with Voice Assistant Shortcut */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>AI Voice-Powered Productivity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Smart Tasks & To-Do
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your daily academic schedule, study goals, and assignments using natural voice commands.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setVoiceModalOpen(true)}
            leftIcon={Mic}
            className="border-brand-200 dark:border-brand-900 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40"
          >
            Voice Command
          </Button>

          <Button size="sm" variant="primary" onClick={() => handleOpenModal()} leftIcon={Plus}>
            Add Task
          </Button>
        </div>
      </div>

      {/* Voice Assistant Promotion Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white shadow-md shadow-brand-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Say it, and AttendX will track it!</h3>
            <p className="text-xs text-indigo-100">
              Speak in English, Hindi, or Hinglish: "Kal shaam 7 baje DBMS revise karna hai" or "Add a high priority coding task".
            </p>
          </div>
        </div>

        <button
          onClick={() => setVoiceModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-white text-brand-700 hover:bg-indigo-50 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 shrink-0"
        >
          <Mic className="w-3.5 h-3.5 text-brand-600" />
          <span>Try Voice Assistant</span>
        </button>
      </div>

      {/* 4 Overview Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-brand-600">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Tasks</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {summary?.totalTasks || 0}
            </p>
          </div>
          <ListTodo className="w-7 h-7 text-brand-500/30" />
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <span className="text-xs font-semibold text-slate-500">Completed</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {summary?.completedTasks || 0}
            </p>
          </div>
          <CheckCircle2 className="w-7 h-7 text-emerald-500/30" />
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <span className="text-xs font-semibold text-slate-500">Pending</span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {summary?.pendingTasks || 0}
            </p>
          </div>
          <Clock className="w-7 h-7 text-amber-500/30" />
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <span className="text-xs font-semibold text-slate-500">Overdue</span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {summary?.overdueTasks || 0}
            </p>
          </div>
          <AlertCircle className="w-7 h-7 text-rose-500/30" />
        </Card>
      </div>

      {/* Completion Progress Bar */}
      {summary && summary.totalTasks > 0 && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Overall Productivity Progress
            </span>
            <span className="font-bold text-brand-600 dark:text-brand-400">
              {summary.completionRate}% Done ({summary.completedTasks}/{summary.totalTasks})
            </span>
          </div>
          <ProgressBar progress={summary.completionRate} colorClass="bg-brand-600" />
        </Card>
      )}

      {/* Quick Add Bar */}
      <Card className="p-3">
        <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Type a new task and press Enter... (e.g. Complete DSA assignment)"
            className="flex-1 w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <select
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface text-slate-900 dark:text-white font-medium"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface text-slate-900 dark:text-white font-medium"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p} Priority
              </option>
            ))}
          </select>

          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!quickTitle.trim()}
            isLoading={quickAdding}
            className="w-full sm:w-auto"
          >
            Add Task
          </Button>
        </form>
      </Card>

      {/* Tabs & Filter Bar */}
      <div className="space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-dark-border pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Tasks' },
              { id: 'today', label: 'Today' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'completed', label: 'Completed' },
              { id: 'overdue', label: 'Overdue' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusTab === tab.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-card'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {summary?.completedTasks > 0 && (
            <button
              onClick={handleClearCompleted}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Completed</span>
            </button>
          )}
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border">
          {/* Category Pill Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                  selectedCategory === cat
                    ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Right: Search, Priority & Sort */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Priority */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface px-2.5 py-1.5 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface px-2.5 py-1.5 text-slate-700 dark:text-slate-300"
            >
              <option value="dueDate_asc">Earliest Deadline</option>
              <option value="dueDate_desc">Latest Deadline</option>
              <option value="priority">Priority</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <Card className="text-center py-16 space-y-3">
          <CheckSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No tasks found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {statusTab === 'completed'
              ? 'No completed tasks yet. Finish some to-dos to see them here!'
              : 'Add a new task using the quick add bar above or tap the Voice Assistant mic to speak.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => {
            const isOverdue =
              !task.completed && task.dueDate && task.dueDate < todayStr;
            const isDueToday =
              !task.completed && task.dueDate && task.dueDate === todayStr;

            return (
              <div
                key={task._id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                  task.completed
                    ? 'bg-slate-50/60 dark:bg-dark-card/40 border-slate-200/60 dark:border-dark-border opacity-70'
                    : isOverdue
                    ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40 hover:border-rose-300'
                    : 'bg-white dark:bg-dark-card border-slate-200/80 dark:border-dark-border hover:border-brand-500/30 hover:shadow-xs'
                }`}
              >
                {/* Left: Checkbox + Title & Details */}
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(task)}
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                      task.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-brand-500 bg-white dark:bg-dark-surface'
                    }`}
                  >
                    {task.completed && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <p
                      className={`text-sm font-bold truncate ${
                        task.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </p>

                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Category Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-surface text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                        {getCategoryIcon(task.category)}
                        <span>{task.category}</span>
                      </span>

                      {/* Priority Badge */}
                      <Badge
                        size="sm"
                        variant={
                          task.priority === 'High'
                            ? 'danger'
                            : task.priority === 'Medium'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {task.priority}
                      </Badge>

                      {/* Due Date & Time */}
                      {task.dueDate && (
                        <span
                          className={`flex items-center gap-1 font-semibold text-[11px] ${
                            isOverdue
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : isDueToday
                              ? 'text-amber-600 dark:text-amber-400 font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>
                            {isDueToday
                              ? 'Today'
                              : isOverdue
                              ? `Overdue (${task.dueDate})`
                              : task.dueDate}
                          </span>
                          {task.dueTime && (
                            <span className="ml-0.5 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{task.dueTime}</span>
                            </span>
                          )}
                        </span>
                      )}

                      {/* Source badge if voice */}
                      {task.source === 'voice_assistant' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-brand-600 dark:text-brand-400 font-semibold bg-brand-50 dark:bg-brand-950/60 px-1.5 py-0.5 rounded">
                          <Mic className="w-2.5 h-2.5" />
                          <span>Voice AI</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenModal(task)}
                    className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-surface"
                    title="Edit Task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          <Input
            label="Task Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Complete DSA assignment or Study DBMS"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-xs px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
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
                    {p} Priority
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
            />

            <Input
              label="Due Time (Optional)"
              type="time"
              value={formData.dueTime}
              onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
            />
          </div>

          {subjects.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
                Link to Course / Subject (Optional)
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-xs px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500"
              >
                <option value="">No subject linked</option>
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name} {sub.code ? `(${sub.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
              Notes / Description (Optional)
            </label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add any specific requirements, chapters, or details..."
              className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-xs p-3 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={savingTask}>
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onTaskActionSuccess={() => loadData()}
      />
    </div>
  );
};

export default TodoPage;

