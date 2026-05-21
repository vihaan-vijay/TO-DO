export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Tag {
  id: string;
  name: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  taskId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  subtasks: Subtask[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string | null;
  tags?: string[];
  subtasks?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  completed?: boolean;
  priority?: Priority;
  dueDate?: string | null;
  tags?: string[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TasksResponse {
  tasks: Task[];
  pagination: PaginationInfo;
}

export interface TaskFilters {
  completed?: string;
  priority?: Priority;
  search?: string;
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
