
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type SortField = 'full_name' | 'cluster' | 'created_at';
export type SortDirection = 'asc' | 'desc';

export interface FiltersState {
  searchTerm: string;
  sortField: SortField;
  sortDirection: SortDirection;
}

interface SubmissionsFiltersProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
}

const SubmissionsFilters: React.FC<SubmissionsFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchTerm: value
    });
  };

  const handleSortFieldChange = (field: SortField) => {
    onFiltersChange({
      ...filters,
      sortField: field
    });
  };

  const handleSortDirectionToggle = () => {
    onFiltersChange({
      ...filters,
      sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc'
    });
  };

  const getSortIcon = () => {
    if (filters.sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4" />;
    }
    return <ArrowDown className="h-4 w-4" />;
  };

  const getSortLabel = (field: SortField) => {
    switch (field) {
      case 'full_name':
        return 'Name';
      case 'cluster':
        return 'Cluster';
      case 'created_at':
        return 'Date Created';
      default:
        return field;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, email, title, or cluster..."
          value={filters.searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="flex gap-2">
        <Select value={filters.sortField} onValueChange={handleSortFieldChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Date Created</SelectItem>
            <SelectItem value="full_name">Name</SelectItem>
            <SelectItem value="cluster">Cluster</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleSortDirectionToggle}
          title={`Sort ${getSortLabel(filters.sortField)} ${filters.sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
        >
          {getSortIcon()}
        </Button>
      </div>
    </div>
  );
};

export default SubmissionsFilters;
