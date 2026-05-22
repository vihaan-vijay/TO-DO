import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, ListChecks, CheckCircle2, Clock, Loader2, BarChart2, Zap } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Navbar } from '../components/Navbar';
import { TaskCard } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import { FilterBar } from '../components/FilterBar';
import { useTasks } from '../hooks/useTasks';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types';

// ── Analytics Panel ────────────────────────────────────────────────────────────
function AnalyticsPanel({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const highCount = tasks.filter((t) => t.priority === 'HIGH' && !t.completed).length;
  const medCount = tasks.filter((t) => t.priority === 'MEDIUM' && !t.completed).length;
  const lowCount = tasks.filter((t) => t.priority === 'LOW' && !t.completed).length;
  const pendingTotal = highCount + medCount + lowCount || 1;

  return (
    <div className="analytics-section">
      <p className="analytics-title">
        <BarChart2 size={11} style={{ display: 'inline', marginRight: 4 }} />
        Analytics
      </p>
      <div className="analytics-grid">
        {/* Completion Ring */}
        <div className="analytics-card">
          <p className="analytics-card-label">
            <CheckCircle2 size={11} /> Completion
          </p>
          <div className="completion-ring-wrapper">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle
                cx="36" cy="36" r={radius}
                fill="none"
                stroke={pct === 100 ? 'var(--success)' : 'var(--accent)'}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--text)">{pct}%</text>
            </svg>
            <div>
              <div className="completion-ring-text">{completed}</div>
              <div className="completion-ring-sub">of {total} done</div>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="analytics-card">
          <p className="analytics-card-label">
            <Zap size={11} /> Priority Queue
          </p>
          <div className="priority-breakdown">
            <div className="priority-bar-row">
              <span className="priority-bar-label" style={{ color: 'var(--danger)' }}>High</span>
              <div className="priority-bar-track">
                <div className="priority-bar-fill" style={{ width: `${(highCount / pendingTotal) * 100}%`, background: 'var(--danger)' }} />
              </div>
              <span className="priority-bar-count">{highCount}</span>
            </div>
            <div className="priority-bar-row">
              <span className="priority-bar-label" style={{ color: 'var(--warning)' }}>Med</span>
              <div className="priority-bar-track">
                <div className="priority-bar-fill" style={{ width: `${(medCount / pendingTotal) * 100}%`, background: 'var(--warning)' }} />
              </div>
              <span className="priority-bar-count">{medCount}</span>
            </div>
            <div className="priority-bar-row">
              <span className="priority-bar-label" style={{ color: 'var(--success)' }}>Low</span>
              <div className="priority-bar-track">
                <div className="priority-bar-fill" style={{ width: `${(lowCount / pendingTotal) * 100}%`, background: 'var(--success)' }} />
              </div>
              <span className="priority-bar-count">{lowCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Due Date Reminder Hook ─────────────────────────────────────────────────────
function useDueDateReminders(tasks: Task[]) {
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const check = () => {
      if (Notification.permission !== 'granted') return;
      const today = new Date();
      tasks.forEach((task) => {
        if (task.completed || !task.dueDate) return;
        const due = new Date(task.dueDate);
        const isToday =
          due.getFullYear() === today.getFullYear() &&
          due.getMonth() === today.getMonth() &&
          due.getDate() === today.getDate();
        if (isToday) {
          new Notification('⏰ Task Due Today — TaskFlow', {
            body: task.title,
            icon: '/vite.svg',
            tag: `task-reminder-${task.id}`,
          });
        }
      });
    };
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [tasks]);
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export function Dashboard() {
  const {
    tasks,
    filters,
    setFilters,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  } = useTasks();

  /**
   * ORDERING: We only store task IDs for ordering — the actual task data
   * always comes from `tasks` (single source of truth). This eliminates
   * the duplication bug caused by maintaining two full task arrays.
   *
   * We use a ref to track the PREVIOUS set of IDs so we can detect
   * genuine additions/removals without firing on every reference change.
   */
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const prevIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const incomingIds = tasks.map((t) => t.id);
    const incomingSet = new Set(incomingIds);
    const prevSet = prevIdsRef.current;

    // Check if the SET of IDs has actually changed (not just the array reference)
    const added = incomingIds.filter((id) => !prevSet.has(id));
    const removed = [...prevSet].filter((id) => !incomingSet.has(id));

    if (added.length === 0 && removed.length === 0) {
      // Only data changed (e.g., toggle, update) — no reorder needed
      prevIdsRef.current = incomingSet;
      return;
    }

    prevIdsRef.current = incomingSet;

    setOrderedIds((prev) => {
      // Remove IDs that no longer exist
      const pruned = prev.filter((id) => incomingSet.has(id));
      // Prepend brand-new IDs (newly created tasks show at top)
      const prunedSet = new Set(pruned);
      const newIds = incomingIds.filter((id) => !prunedSet.has(id));
      return [...newIds, ...pruned];
    });
  }, [tasks]);

  // Build display list: map ordered IDs → task objects (always fresh from hook)
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const displayTasks = orderedIds.map((id) => taskMap.get(id)).filter(Boolean) as Task[];

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useDueDateReminders(displayTasks);

  // Stats always from the hook's canonical data (no display-layer distortion)
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const overdueTasks = tasks.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  // ── DnD ──────────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedIds((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCreate = async (data: CreateTaskInput) => {
    setShowForm(false);
    try {
      await createTask(data);
    } catch {
      // Optimistic task is rolled back automatically in useTasks on failure
    }
  };

  const handleUpdate = async (data: CreateTaskInput) => {
    if (!editingTask) return;
    setEditingTask(null);
    try {
      await updateTask(editingTask.id, data as UpdateTaskInput);
    } catch {
      // error handled in hook
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      <Navbar />

      <main className="dashboard-main">
        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-card">
            <ListChecks size={18} className="stat-icon stat-icon-total" />
            <span className="stat-value">{totalTasks}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card">
            <CheckCircle2 size={18} className="stat-icon stat-icon-done" />
            <span className="stat-value">{completedTasks}</span>
            <span className="stat-label">Done</span>
          </div>
          <div className="stat-card">
            <Clock size={18} className="stat-icon stat-icon-pending" />
            <span className="stat-value">{pendingTasks}</span>
            <span className="stat-label">Pending</span>
          </div>
          {overdueTasks > 0 && (
            <div className="stat-card stat-card-danger">
              <Clock size={18} className="stat-icon stat-icon-overdue" />
              <span className="stat-value">{overdueTasks}</span>
              <span className="stat-label">Overdue</span>
            </div>
          )}
        </div>

        {/* Analytics Panel */}
        {totalTasks > 0 && <AnalyticsPanel tasks={displayTasks} />}

        {/* Toolbar */}
        <div className="dashboard-toolbar">
          <FilterBar filters={filters} onFiltersChange={setFilters} />
          <button className="btn btn-primary" onClick={() => setShowForm(true)} id="add-task-btn">
            <Plus size={16} />
            <span className="btn-label">New Task</span>
          </button>
        </div>

        {/* Task List */}
        <div className="task-list">
          {isLoading && displayTasks.length === 0 ? (
            // Only show spinner on the very first load (no tasks visible yet)
            <div className="task-list-empty">
              <Loader2 size={28} className="spin" />
              <p>Loading your tasks...</p>
            </div>
          ) : !isLoading && displayTasks.length === 0 ? (
            <div className="task-list-empty">
              <ListChecks size={40} className="empty-icon" />
              <h3>No tasks yet</h3>
              <p>Create your first task to get started</p>
              <button className="btn btn-primary" onClick={() => setShowForm(true)} id="empty-add-btn">
                <Plus size={14} />
                New Task
              </button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                <AnimatePresence mode="popLayout">
                  {displayTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onEdit={setEditingTask}
                      onAddSubtask={addSubtask}
                      onToggleSubtask={toggleSubtask}
                      onDeleteSubtask={deleteSubtask}
                    />
                  ))}
                </AnimatePresence>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </main>

      {/* Modals */}
      {showForm && <TaskForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />}
      {editingTask && (
        <TaskForm task={editingTask} onSubmit={handleUpdate} onClose={() => setEditingTask(null)} />
      )}
    </div>
  );
}
