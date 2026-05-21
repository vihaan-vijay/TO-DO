import { useState, useEffect, type FormEvent } from 'react';
import { X, Plus, Save } from 'lucide-react';
import type { Task, CreateTaskInput, Priority } from '../types';

interface TaskFormProps {
  task?: Task | null;
  onSubmit: (data: CreateTaskInput) => void;
  onClose: () => void;
}

export function TaskForm({ task, onSubmit, onClose }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setTagsInput(task.tags.map((t) => t.name).join(', '));
    }
  }, [task]);

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks((prev) => [...prev, newSubtask.trim()]);
    setNewSubtask('');
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      tags: tags.length > 0 ? tags : undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn-icon-sm" onClick={onClose} id="close-modal-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="form-input form-textarea"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="form-input form-select"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-due-date">Due Date</label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="task-tags">Tags</label>
            <input
              id="task-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="comma separated — work, personal"
              className="form-input"
            />
          </div>

          {/* Subtasks (only for new tasks) */}
          {!task && (
            <div className="form-group">
              <label>Subtasks</label>
              <div className="form-subtasks">
                {subtasks.map((st, i) => (
                  <div key={i} className="form-subtask-item">
                    <span>{st}</span>
                    <button
                      type="button"
                      className="btn-icon-sm btn-icon-danger"
                      onClick={() => handleRemoveSubtask(i)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <div className="form-subtask-add">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Add a subtask..."
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm-pad"
                    onClick={handleAddSubtask}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="submit-task-btn">
              {task ? <Save size={14} /> : <Plus size={14} />}
              {task ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
