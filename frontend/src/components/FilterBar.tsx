import { Search, SlidersHorizontal } from 'lucide-react';
import type { TaskFilters, Priority } from '../types';

interface FilterBarProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  return (
    <div className="filter-bar">
      <div className="filter-search">
        <Search size={16} className="filter-search-icon" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value, page: 1 })}
          className="form-input filter-search-input"
          id="search-tasks"
        />
      </div>

      <div className="filter-controls">
        <SlidersHorizontal size={16} className="filter-icon" />

        <select
          value={filters.completed || ''}
          onChange={(e) => onFiltersChange({ ...filters, completed: e.target.value || undefined, page: 1 })}
          className="form-input form-select filter-select"
          id="filter-status"
        >
          <option value="">All Status</option>
          <option value="false">Active</option>
          <option value="true">Completed</option>
        </select>

        <select
          value={filters.priority || ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              priority: (e.target.value as Priority) || undefined,
              page: 1,
            })
          }
          className="form-input form-select filter-select"
          id="filter-priority"
        >
          <option value="">All Priorities</option>
          <option value="HIGH">🔴 High</option>
          <option value="MEDIUM">🟡 Medium</option>
          <option value="LOW">🟢 Low</option>
        </select>

        <select
          value={filters.sortBy || 'createdAt'}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              sortBy: e.target.value as TaskFilters['sortBy'],
            })
          }
          className="form-input form-select filter-select"
          id="filter-sort"
        >
          <option value="createdAt">Newest First</option>
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>
    </div>
  );
}
