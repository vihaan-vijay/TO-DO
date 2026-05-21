import { useState } from 'react';
import { Check, Trash2, Edit3, Clock, Flag, Tag, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
}

const priorityConfig = {
  LOW: { label: 'Low', className: 'priority-low' },
  MEDIUM: { label: 'Med', className: 'priority-medium' },
  HIGH: { label: 'High', className: 'priority-high' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export function TaskCard({
  task,
  onToggle,
  onDelete,
  onEdit,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const priority = priorityConfig[task.priority];
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    onAddSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
    setShowSubtaskInput(false);
  };

  return (
    <div
      className={`task-card ${task.completed ? 'task-completed' : ''} ${isOverdue(task.dueDate) && !task.completed ? 'task-overdue' : ''}`}
      id={`task-${task.id}`}
    >
      <div className="task-card-main">
        <button
          className={`task-check ${task.completed ? 'checked' : ''}`}
          onClick={() => onToggle(task.id)}
          id={`toggle-${task.id}`}
        >
          {task.completed && <Check size={12} strokeWidth={3} />}
        </button>

        <div className="task-content" onClick={() => setExpanded(!expanded)}>
          <h3 className="task-title">{task.title}</h3>
          <div className="task-meta">
            <span className={`task-priority ${priority.className}`}>
              <Flag size={10} />
              {priority.label}
            </span>
            {task.dueDate && (
              <span className={`task-due ${isOverdue(task.dueDate) && !task.completed ? 'overdue' : ''}`}>
                <Clock size={10} />
                {formatDate(task.dueDate)}
              </span>
            )}
            {task.tags.length > 0 && (
              <span className="task-tags-inline">
                <Tag size={10} />
                {task.tags.map((t) => t.name).join(', ')}
              </span>
            )}
            {totalSubtasks > 0 && (
              <span className="task-subtask-count">
                {completedSubtasks}/{totalSubtasks} subtasks
              </span>
            )}
          </div>
        </div>

        <div className="task-actions">
          <button className="btn-icon-sm" onClick={() => onEdit(task)} title="Edit">
            <Edit3 size={14} />
          </button>
          <button className="btn-icon-sm btn-icon-danger" onClick={() => onDelete(task.id)} title="Delete">
            <Trash2 size={14} />
          </button>
          {(task.description || totalSubtasks > 0) && (
            <button className="btn-icon-sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Section */}
      {expanded && (
        <div className="task-expanded">
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}

          {/* Subtasks */}
          <div className="subtask-section">
            <div className="subtask-header">
              <span className="subtask-label">Subtasks</span>
              <button
                className="btn-icon-sm"
                onClick={() => setShowSubtaskInput(!showSubtaskInput)}
                title="Add subtask"
              >
                <Plus size={14} />
              </button>
            </div>

            {showSubtaskInput && (
              <div className="subtask-input-row">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="Add a subtask..."
                  className="form-input subtask-input"
                  autoFocus
                />
                <button className="btn-icon-sm" onClick={handleAddSubtask}>
                  <Check size={14} />
                </button>
                <button className="btn-icon-sm" onClick={() => { setShowSubtaskInput(false); setNewSubtask(''); }}>
                  <X size={14} />
                </button>
              </div>
            )}

            {task.subtasks.map((subtask) => (
              <div key={subtask.id} className={`subtask-item ${subtask.completed ? 'subtask-done' : ''}`}>
                <button
                  className={`subtask-check ${subtask.completed ? 'checked' : ''}`}
                  onClick={() => onToggleSubtask(task.id, subtask.id)}
                >
                  {subtask.completed && <Check size={10} strokeWidth={3} />}
                </button>
                <span className="subtask-title">{subtask.title}</span>
                <button
                  className="btn-icon-sm btn-icon-danger subtask-delete"
                  onClick={() => onDeleteSubtask(task.id, subtask.id)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
