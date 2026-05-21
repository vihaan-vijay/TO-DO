import type { CreateTaskInput, TaskFilters, TasksResponse, UpdateTaskInput, Task, Subtask } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An unexpected error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Tasks
  async getTasks(filters?: TaskFilters): Promise<TasksResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });
    }
    const query = params.toString();
    return this.request<TasksResponse>(`/tasks${query ? `?${query}` : ''}`);
  }

  async createTask(data: CreateTaskInput): Promise<{ task: Task }> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: UpdateTaskInput): Promise<{ task: Task }> {
    return this.request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string): Promise<{ message: string }> {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleTask(id: string): Promise<{ task: Task }> {
    return this.request(`/tasks/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  // Subtasks
  async addSubtask(taskId: string, title: string): Promise<{ subtask: Subtask }> {
    return this.request(`/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async toggleSubtask(taskId: string, subtaskId: string): Promise<{ subtask: Subtask }> {
    return this.request(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteSubtask(taskId: string, subtaskId: string): Promise<{ message: string }> {
    return this.request(`/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient(API_URL);
