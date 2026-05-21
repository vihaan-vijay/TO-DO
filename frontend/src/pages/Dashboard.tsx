import { useState } from 'react';
import { Plus, ListChecks, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { TaskCard } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import { FilterBar } from '../components/FilterBar';
import { useTasks } from '../hooks/useTasks';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types';
import toast from 'react-hot-toast';

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
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const overdueTasks = tasks.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  const handleCreate = async (data: CreateTaskInput) => {
    try {
      await createTask(data);
      setShowForm(false);
      toast.success('Task created');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const handleUpdate = async (data: CreateTaskInput) => {
    if (!editingTask) return;
    try {
      await updateTask(editingTask.id, data as UpdateTaskInput);
      setEditingTask(null);
      toast.success('Task updated');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      toast.success('Task deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const task = await toggleTask(id);
      toast.success(task.completed ? 'Done ✓' : 'Reopened');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle task');
    }
  };

  const handleAddSubtask = async (taskId: string, title: string) => {
    try {
      await addSubtask(taskId, title);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add subtask');
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    try {
      await toggleSubtask(taskId, subtaskId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle subtask');
    }
  };

  const handleDeleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      await deleteSubtask(taskId, subtaskId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete subtask');
    }
  };

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
          {isLoading ? (
            <div className="task-list-empty">
              <Loader2 size={28} className="spin" />
              <p>Loading...</p>
            </div>
          ) : tasks.length === 0 ? (
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
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={setEditingTask}
                onAddSubtask={handleAddSubtask}
                onToggleSubtask={handleToggleSubtask}
                onDeleteSubtask={handleDeleteSubtask}
              />
            ))
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
