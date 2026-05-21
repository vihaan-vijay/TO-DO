import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskFilters, CreateTaskInput, UpdateTaskInput, PaginationInfo } from '../types';
import { api } from '../api/client';

export function useTasks(initialFilters?: TaskFilters) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [filters, setFilters] = useState<TaskFilters>(initialFilters || {});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getTasks(filters);
      setTasks(res.tasks);
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

  const createTask = useCallback(async (data: CreateTaskInput) => {
    const res = await api.createTask(data);
    setTasks((prev) => [res.task, ...prev]);
    return res.task;
  }, []);

  const updateTask = useCallback(async (id: string, data: UpdateTaskInput) => {
    const res = await api.updateTask(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? res.task : t)));
    return res.task;
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    // Optimistic UI Update: Remove the task from the screen immediately
    setTasks((prev) => prev.filter((t) => t.id !== id));
    
    try {
      // Perform the actual deletion in the background
      await api.deleteTask(id);
    } catch (err) {
      // If the deletion fails, refetch the tasks from the server to restore it
      console.error("Failed to delete task:", err);
      fetchTasks();
    }
  }, [fetchTasks]);

  const toggleTask = useCallback(async (id: string) => {
    const res = await api.toggleTask(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? res.task : t)));
    return res.task;
  }, []);

  // Subtask operations
  const addSubtask = useCallback(async (taskId: string, title: string) => {
    const res = await api.addSubtask(taskId, title);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: [...t.subtasks, res.subtask] } : t
      )
    );
    return res.subtask;
  }, []);

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
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
    return res.subtask;
  }, []);

  const deleteSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    await api.deleteSubtask(taskId, subtaskId);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }
          : t
      )
    );
  }, []);

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
