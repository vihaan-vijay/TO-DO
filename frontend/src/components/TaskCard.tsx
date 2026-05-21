import { useState } from 'react';
import { Check, Trash2, Edit3, Clock, Flag, Tag, ChevronDown, Plus, X, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
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

// ─── The industry standard fix for dnd-kit + interactive elements ──────────
// Block pointerdown on ALL interactive elements so the PointerSensor never
// mistakes a click on a button/input for the start of a drag gesture.
const stopPointer = (e: React.PointerEvent) => e.stopPropagation();

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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const progressPercent = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    onAddSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
    setShowSubtaskInput(false);
  };

  const handleToggleWrapper = () => {
    // Optimistic toast — fires instantly
    if (!task.completed) {
      toast.success('Done ✓');
      if (task.priority === 'HIGH') {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#818cf8', '#22c55e', '#f59e0b', '#ef4444'],
        });
      }
    } else {
      toast.success('Reopened ✓');
    }
    onToggle(task.id);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, type: 'spring', bounce: 0.2 }}
      className={`task-card glass ${task.completed ? 'task-completed' : ''} ${isOverdue(task.dueDate) && !task.completed ? 'task-overdue' : ''} ${isDragging ? 'task-card-dragging' : ''}`}
      id={`task-${task.id}`}
    >
      <div className="task-card-main">
        {/* Drag handle — the ONLY element that has dnd-kit listeners */}
        <div className="drag-handle" {...attributes} {...listeners}>
          <GripVertical size={14} />
        </div>

        {/* Checkbox — blocks pointerdown so dnd never sees it */}
        <button
          className={`task-check ${task.completed ? 'checked' : ''}`}
          onPointerDown={stopPointer}
          onClick={handleToggleWrapper}
          id={`toggle-${task.id}`}
        >
          {task.completed && <Check size={12} strokeWidth={3} />}
        </button>

        {/* Task content — blocks pointerdown so expanding doesn't start a drag */}
        <div
          className="task-content"
          onPointerDown={stopPointer}
          onClick={() => setExpanded(!expanded)}
        >
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

          {/* Progress Bar */}
          {totalSubtasks > 0 && (
            <div style={{ marginTop: '8px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ height: '100%', background: progressPercent === 100 ? 'var(--success)' : 'var(--accent)', borderRadius: '2px' }}
              />
            </div>
          )}
        </div>

        {/* Action buttons — all block pointerdown */}
        <div className="task-actions" onPointerDown={stopPointer}>
          <button className="btn-icon-sm" onClick={() => onEdit(task)} title="Edit">
            <Edit3 size={14} />
          </button>
          <button className="btn-icon-sm btn-icon-danger" onClick={() => onDelete(task.id)} title="Delete">
            <Trash2 size={14} />
          </button>
          {(task.description || totalSubtasks > 0) && (
            <button className="btn-icon-sm" onClick={() => setExpanded(!expanded)}>
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} />
              </motion.div>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="task-expanded"
            style={{ overflow: 'hidden' }}
            onPointerDown={stopPointer}
          >
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

              <AnimatePresence>
                {showSubtaskInput && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="subtask-input-row"
                    style={{ overflow: 'hidden' }}
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {task.subtasks.map((subtask) => (
                  <motion.div
                    key={subtask.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    className={`subtask-item ${subtask.completed ? 'subtask-done' : ''}`}
                  >
                    <button
                      className={`subtask-check ${subtask.completed ? 'checked' : ''}`}
                      onPointerDown={stopPointer}
                      onClick={() => onToggleSubtask(task.id, subtask.id)}
                    >
                      {subtask.completed && <Check size={10} strokeWidth={3} />}
                    </button>
                    <span className="subtask-title">{subtask.title}</span>
                    <button
                      className="btn-icon-sm btn-icon-danger subtask-delete"
                      onPointerDown={stopPointer}
                      onClick={() => onDeleteSubtask(task.id, subtask.id)}
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
