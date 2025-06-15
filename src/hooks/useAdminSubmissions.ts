
import { useState, useEffect, useMemo } from 'react';
import type { Submission } from '@/components/admin/SubmissionForms';
import type { FiltersState, SortField } from '@/components/admin/SubmissionsFilters';
import { supabase } from '@/integrations/supabase/client';

export function useAdminSubmissions(navigate: (to: string) => void, toast: (options: any) => void) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState<FiltersState>({
    searchTerm: '',
    sortField: 'created_at',
    sortDirection: 'desc',
  });

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
      navigate('/admin');
      return;
    }
    fetchSubmissions();
    // eslint-disable-next-line
  }, [navigate]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-submissions', {
        method: 'GET',
      });
      if (error) {
        setError('Failed to fetch submissions');
        return;
      }
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedSubmissions = useMemo(() => {
    let result = [...submissions];
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(submission =>
        submission.full_name.toLowerCase().includes(searchLower) ||
        submission.email.toLowerCase().includes(searchLower) ||
        (submission.title && submission.title.toLowerCase().includes(searchLower)) ||
        submission.cluster.toLowerCase().includes(searchLower)
      );
    }
    result.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      switch (filters.sortField) {
        case 'full_name':
          aValue = a.full_name.toLowerCase();
          bValue = b.full_name.toLowerCase();
          break;
        case 'cluster':
          aValue = a.cluster.toLowerCase();
          bValue = b.cluster.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }
      if (aValue < bValue) {
        return filters.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return filters.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return result;
  }, [submissions, filters]);

  return {
    submissions,
    setSubmissions,
    loading,
    error,
    setError,
    filters,
    setFilters,
    filteredAndSortedSubmissions,
    fetchSubmissions,
  };
}
