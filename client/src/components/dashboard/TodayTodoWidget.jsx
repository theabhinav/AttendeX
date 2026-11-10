import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  Plus,
  ArrowRight,
  Mic,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { taskService } from '../../services/taskService';
import toast from 'react-hot-toast';

const TodayTodoWidget = ({ onOpenVoiceAssistant }) => {
  const [todayTasks, setTodayTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickTitle, setQuickTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const loadTodayTasks = async () => {
    try {
      setLoading(true);
      const res = await taskService.getTasks({ status: 'today' });
      setTodayTasks(res.tasks || []);
    } catch (err) {
      console.warn('Could not load today tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayTasks();

    const handleTaskUpdated = () => {
      loadTodayTasks();
    };

    window.addEventListener('attendx:task-updated', handleTaskUpdated);
    return () => {
      window.removeEventListener('attendx:task-updated', handleTaskUpdated);
    };
  }, []);

  const handleToggle = async (task) => {
    try {
      await taskService.toggleTask(task._id);
      loadTodayTasks();
    } catch (e) {
      toast.error('Failed to update task');
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    try {
      setAdding(true);
      const todayStr = new Date().toISOString().split('T')[0];
      await taskService.createTask({
        title: quickTitle.trim(),
        dueDate: todayStr,
        category: 'Academics',
        priority: 'Medium',
      });
      setQuickTitle('');
      toast.success('Task added for today!');
      loadTodayTasks();
    } catch (err) {
      toast.error('Failed to add task');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Today's Action Items
            </h3>
            <p className="text-[11px] text-slate-400">
              {todayTasks.length} pending {todayTasks.length === 1 ? 'task' : 'tasks'} for today
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenVoiceAssistant && (
            <button
              onClick={onOpenVoiceAssistant}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
              title="Add task via voice"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          )}

          <Link
            to="/tasks"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-2 animate-pulse py-2">
          <div className="h-9 bg-slate-100 dark:bg-dark-surface rounded-xl" />
          <div className="h-9 bg-slate-100 dark:bg-dark-surface rounded-xl" />
        </div>
      ) : todayTasks.length === 0 ? (
        <div className="text-center py-6 space-y-1.5">
          <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            All clear for today!
          </p>
          <p className="text-[11px] text-slate-400">
            No pending tasks due today. Add one below or enjoy your free time!
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {todayTasks.slice(0, 5).map((task) => (
            <div
              key={task._id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/50 hover:bg-slate-50 dark:hover:bg-dark-surface transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => handleToggle(task)}
                  className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 hover:border-emerald-500 flex items-center justify-center shrink-0"
                >
                  {task.completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{task.category}</span>
                    {task.dueTime && (
                      <span className="flex items-center gap-0.5 text-brand-600 dark:text-brand-400 font-semibold">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{task.dueTime}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

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
            </div>
          ))}
        </div>
      )}

      {/* Quick Add Input */}
      <form onSubmit={handleQuickAdd} className="flex items-center gap-1.5 pt-1">
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Add task for today..."
          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={!quickTitle.trim() || adding}
          className="p-1.5 rounded-xl bg-brand-600 text-white disabled:opacity-40 hover:bg-brand-700 transition-colors"
          title="Add task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </Card>
  );
};

export default TodayTodoWidget;

