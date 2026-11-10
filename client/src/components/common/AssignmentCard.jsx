import React from 'react';
import Card from './Card';
import Badge from './Badge';
import Button from './Button';
import {
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Send,
  Check,
  FileText,
} from 'lucide-react';

const GoogleClassroomLogo = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 48 48">
    <path
      fill="#ffba00"
      d="M42 10v28c0 2.2-1.8 4-4 4H10c-2.2 0-4-1.8-4-4V10c0-2.2 1.8-4 4-4h28c2.2 0 4 1.8 4 4z"
    />
    <path
      fill="#00832d"
      d="M37 38H11c-1.1 0-2-.9-2-2V12c0-1.1.9-2 2-2h26c1.1 0 2 .9 2 2v24c0 1.1-.9 2-2 2z"
    />
    <circle cx="24" cy="20" r="4" fill="#ffffff" />
    <path fill="#ffffff" d="M24 26c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" />
    <circle cx="16" cy="21" r="2.5" fill="#a8dab5" />
    <path fill="#a8dab5" d="M16 25c-2.8 0-5 1.5-5 3.5v.5h4v-1.5c0-.9.4-1.7 1-2.5z" />
    <circle cx="32" cy="21" r="2.5" fill="#a8dab5" />
    <path fill="#a8dab5" d="M32 25c-.6.8-1 1.6-1 2.5v1.5h4v-.5c0-2-2.2-3.5-5-3.5z" />
  </svg>
);

const AssignmentCard = ({
  assignment,
  onStatusToggle,
  onOpenSubmitModal,
  onUnsubmit,
  onEdit,
  onDelete,
  unsubmitting = false,
  compact = false,
}) => {
  const isCompleted = assignment.status === 'Completed';
  const dueDateObj = new Date(assignment.dueDate);
  const isOverdue = !isCompleted && dueDateObj < new Date();
  const isFromClassroom = assignment.source === 'google_classroom';

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return <Badge variant="danger" size="sm">Urgent</Badge>;
      case 'High':
        return <Badge variant="warning" size="sm">High Priority</Badge>;
      case 'Medium':
        return <Badge variant="default" size="sm">Medium</Badge>;
      default:
        return <Badge variant="default" size="sm">Low</Badge>;
    }
  };

  return (
    <Card
      padding="p-4 sm:p-5"
      className={`transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200/90 dark:border-slate-800 ${
        isCompleted ? 'opacity-70 bg-slate-50/50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-900'
      }`}
    >
      <div className="flex items-start gap-3.5 min-w-0">
        {onStatusToggle && (
          <button
            onClick={() =>
              onStatusToggle(assignment, isCompleted ? 'Pending' : 'Completed')
            }
            className={`mt-0.5 h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
              isCompleted
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-slate-300 dark:border-slate-600 hover:border-[#E63946]'
            }`}
          >
            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
          </button>
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`text-sm font-semibold text-[#172033] dark:text-white truncate ${
                isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
              }`}
            >
              {assignment.title}
            </span>
            {getPriorityBadge(assignment.priority)}
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
              {assignment.subjectId?.name || assignment.googleCourseName || 'General'}
            </span>
            {isFromClassroom && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                <GoogleClassroomLogo className="w-3 h-3" />
                <span>Classroom</span>
              </span>
            )}
          </div>

          {!compact && assignment.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-1.5 whitespace-pre-line">
              {assignment.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3.5 text-xs text-slate-500 dark:text-slate-400">
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
              <Calendar className="w-3.5 h-3.5" />
              Due: {dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {isOverdue && ' (Overdue)'}
            </span>
            {assignment.submissionLink && (
              <a
                href={assignment.submissionLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#E63946] hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {isFromClassroom ? 'Classroom Portal' : 'Submission Link'}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {isFromClassroom ? (
          !isCompleted ? (
            onOpenSubmitModal && (
              <button
                onClick={() => onOpenSubmitModal(assignment)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                title="Upload file or link and turn in to Google Classroom"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Turn In</span>
              </button>
            )
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 px-2.5 py-1 rounded-md">
                <Check className="w-3 h-3" /> Turned In
              </span>
              {onUnsubmit && (
                <button
                  onClick={() => onUnsubmit(assignment)}
                  disabled={unsubmitting}
                  className="text-[11px] font-medium text-slate-500 hover:text-red-600 underline underline-offset-2 px-1 py-0.5 transition-colors disabled:opacity-50"
                  title="Unsubmit in Google Classroom"
                >
                  {unsubmitting ? '...' : 'Unsubmit'}
                </button>
              )}
            </div>
          )
        ) : onStatusToggle ? (
          <>
            {assignment.status === 'Pending' && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => onStatusToggle(assignment, 'In Progress')}
              >
                Start
              </Button>
            )}
            {assignment.status === 'In Progress' && (
              <Button
                size="xs"
                variant="secondary"
                onClick={() => onStatusToggle(assignment, 'Completed')}
              >
                Complete
              </Button>
            )}
          </>
        ) : null}

        {onEdit && (
          <button
            onClick={() => onEdit(assignment)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit assignment"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(assignment._id)}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Delete assignment"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </Card>
  );
};

export default AssignmentCard;
