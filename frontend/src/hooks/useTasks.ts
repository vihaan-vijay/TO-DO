import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, TaskFilters, CreateTaskInput, UpdateTaskInput, PaginationInfo } from '../types';
import { api } from '../api/client';

export function useTasks(initialFilters?: TaskFilters) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [filters, setFilters] = useState<TaskFilters>(initialFilters || {});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guards against fetchTasks overwriting an in-flight optimistic create
  const pendingCreates = useRef(0);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getTasks(filters);
      // Never stomp optimistic creates that are still in-flight
      if (pendingCreates.current === 0) {
        setTasks(res.tasks);
      }
      setPagination(res.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ── Create ────────────────────────────────────────────────────────────────────
  const createTask = useCallback(async (data: CreateTaskInput): Promise<Task> => {
    const tempId = `temp-${Date.now()}`;
    const mockTask: Task = {
      id: tempId,
      title: data.title,
      description: data.description || null,
      completed: false,
      priority: data.priority || 'MEDIUM',
      dueDate: data.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtasks: (data.subtasks || []).map((t, i) => ({
        id: `sub-temp-${i}`,
        title: t,
        completed: false,
        taskId: tempId,
        createdAt: new Date().toISOString(),
      })),
      tags: (data.tags || []).map((t) => ({ id: `tag-temp-${t}`, name: t })),
    };

    pendingCreates.current += 1;
    setTasks((prev) => [mockTask, ...prev]);

    try {
      const res = await api.createTask(data);
      // Swap the temp placeholder with the real server task
      setTasks((prev) => prev.map((t) => (t.id === tempId ? res.task : t)));
      return res.task;
    } catch (err) {
      // Roll back the optimistic entry on failure
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      throw err;
    } finally {
      pendingCreates.current -= 1;
    }
  }, []);

  // ── Update ────────────────────────────────────────────────────────────────────
  const updateTask = useCallback(async (id: string, data: UpdateTaskInput): Promise<Task> => {
    // Apply optimistic changes immediately
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...(data.title !== undefined && { title: data.title }),
              ...(data.description !== undefined && { description: data.description }),
              ...(data.priority !== undefined && { priority: data.priority }),
              ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
              ...(data.completed !== undefined && { completed: data.completed }),
            }
          : t
      )
    );
    try {
      const res = await api.updateTask(id, data);
      // Sync with ground truth from server (tags may have changed etc.)
      setTasks((prev) => prev.map((t) => (t.id === id ? res.task : t)));
      return res.task;
    } catch (err) {
      fetchTasks(); // Revert on error
      throw err;
    }
  }, [fetchTasks]);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.deleteTask(id);
    } catch (err) {
      console.error('Failed to delete task:', err);
      fetchTasks();
    }
  }, [fetchTasks]);

  // ── Toggle ────────────────────────────────────────────────────────────────────
  const toggleTask = useCallback(async (id: string): Promise<void> => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    try {
      const res = await api.toggleTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.task : t)));
    } catch (err) {
      fetchTasks();
      throw err;
    }
  }, [fetchTasks]);

  // ── Subtasks ──────────────────────────────────────────────────────────────────
  const addSubtask = useCallback(async (taskId: string, title: string): Promise<void> => {
    try {
      const res = await api.addSubtask(taskId, title);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, subtasks: [...t.subtasks, res.subtask] } : t
        )
      );
    } catch (err) {
      fetchTasks();
      throw err;
    }
  }, [fetchTasks]);

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string): Promise<void> => {
    // Optimistic toggle
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, completed: !s.completed } : s
              ),
            }
          : t
      )
    );
    try {
      const res = await api.toggleSubtask(taskId, subtaskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: t.subtasks.map((s) =>
                  s.id === subtaskId ? res.subtask : s
                ),
              }
            : t
        )
      );
    } catch (err) {
      fetchTasks();
      throw err;
    }
  }, [fetchTasks]);

  const deleteSubtask = useCallback(async (taskId: string, subtaskId: string): Promise<void> => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }
          : t
      )
    );
    try {
      await api.deleteSubtask(taskId, subtaskId);
    } catch {
      fetchTasks();
    }
  }, [fetchTasks]);

  return {
    tasks,
    pagination,
    filters,
    setFilters,
    isLoading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  };
}
