'use client';

import { Archive } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useCallback, useMemo, useEffect } from 'react';

import { ArchivedQuestionsList } from '@/components/questions/ArchivedQuestionsList';
import { CategoryTabs } from '@/components/questions/CategoryTabs';
import { FilterEmptyState } from '@/components/questions/FilterEmptyState';
import { QuestionForm } from '@/components/questions/QuestionForm';
import { QuestionsList } from '@/components/questions/QuestionsList';
import { SearchInput } from '@/components/questions/SearchInput';
import { SortDropdown } from '@/components/questions/SortDropdown';
import { StatusFilter } from '@/components/questions/StatusFilter';
import { Button } from '@/components/ui/button';
import { useFilteredQuestions } from '@/hooks/questions/useFilteredQuestions';
import {
  CategoryFilterKey,
  CATEGORY_FILTER_KEYS,
  SortKey,
  SORT_KEYS,
  StatusFilterKey,
  STATUS_FILTER_KEYS,
} from '@/types/question';

interface QuestionsPageClientProps {
  userId: string;
}

/**
 * Client component for the questions page.
 * Handles state for showing/hiding the create form and archived view.
 */
export function QuestionsPageClient({ userId }: QuestionsPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Parse and validate status filter from URL
  const rawFilter = searchParams.get('status');
  const statusFilter: StatusFilterKey =
    rawFilter && STATUS_FILTER_KEYS.includes(rawFilter as StatusFilterKey)
      ? (rawFilter as StatusFilterKey)
      : 'all';

  // Parse and validate category filter from URL
  const rawCategory = searchParams.get('category');
  const categoryFilter: CategoryFilterKey =
    rawCategory && CATEGORY_FILTER_KEYS.includes(rawCategory as CategoryFilterKey)
      ? (rawCategory as CategoryFilterKey)
      : 'all';

  // Parse and validate sort from URL
  const rawSort = searchParams.get('sort');
  const sortBy: SortKey =
    rawSort && SORT_KEYS.includes(rawSort as SortKey)
      ? (rawSort as SortKey)
      : 'newest';

  // Get filtered and sorted questions with counts
  const { questions, counts, categoryCounts, isLoading, error } = useFilteredQuestions(
    statusFilter,
    categoryFilter,
    searchQuery,
    sortBy
  );

  // Update URL without page reload (status)
  const handleFilterChange = useCallback(
    (filter: StatusFilterKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (filter === 'all') {
        params.delete('status'); // Clean URL for default state
      } else {
        params.set('status', filter);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Update URL without page reload (category)
  const handleCategoryChange = useCallback(
    (category: CategoryFilterKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (category === 'all') {
        params.delete('category'); // Clean URL for default state
      } else {
        params.set('category', category);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Update URL without page reload (sort)
  const handleSortChange = useCallback(
    (sort: SortKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (sort === 'newest') {
        params.delete('sort'); // Clean URL for default state
      } else {
        params.set('sort', sort);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const handleNewQuestion = useCallback(() => {
    setShowForm(true);
    setShowArchived(false);
  }, []);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
  }, []);

  const toggleArchived = useCallback(() => {
    setShowArchived((prev) => !prev);
    setShowForm(false);
  }, []);

  const handleShowAll = useCallback(() => {
    handleFilterChange('all');
    handleCategoryChange('all');
    handleSortChange('newest');
    setSearchQuery('');
  }, [handleFilterChange, handleCategoryChange, handleSortChange]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle keyboard shortcut action=new (P3-1)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      setShowForm(true);
      setShowArchived(false);
      // Clean up URL after opening form
      const params = new URLSearchParams(searchParams.toString());
      params.delete('action');
      const newUrl = params.toString() ? `?${params.toString()}` : '/questions';
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router]);

  // Memoize renderEmptyState to prevent recreation on every render
  const renderEmptyState = useMemo(() => {
    // Show empty state if any filter is active (status, category, or search)
    const hasActiveFilters =
      statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery.trim() !== '';

    if (!hasActiveFilters) {
      return undefined;
    }
    const EmptyStateRenderer = () => (
      <FilterEmptyState
        filter={statusFilter}
        totalCount={counts.all}
        onShowAll={handleShowAll}
        searchQuery={searchQuery}
      />
    );
    return EmptyStateRenderer;
  }, [statusFilter, categoryFilter, searchQuery, counts.all, handleShowAll]);

  return (
    <main
      data-testid="questions-page"
      className="min-h-screen bg-background px-4 py-6"
    >
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">
            {showArchived ? 'Archived Questions' : 'Strategic Questions'}
          </h1>
          {!showForm && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleArchived}
                data-testid="view-archived-button"
                className="text-muted-foreground"
              >
                <Archive className="h-4 w-4" />
                {showArchived ? 'Active' : 'Archived'}
              </Button>
              {!showArchived && (
                <button
                  type="button"
                  onClick={handleNewQuestion}
                  data-testid="new-question-button"
                  className="min-h-12 rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  New Question
                </button>
              )}
            </div>
          )}
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="mb-8 rounded-lg border border-border bg-surface p-6">
            <h2 className="mb-4 text-lg font-medium text-foreground">
              Create New Question
            </h2>
            <QuestionForm userId={userId} onCancel={handleFormCancel} />
          </div>
        )}

        {/* Search Input and Sort - show only for active questions view */}
        {!showForm && !showArchived && (
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search questions..."
              />
            </div>
            <SortDropdown value={sortBy} onChange={handleSortChange} />
          </div>
        )}

        {/* Category Tabs - show only for active questions view */}
        {!showForm && !showArchived && (
          <div className="mb-4">
            <CategoryTabs
              value={categoryFilter}
              counts={categoryCounts}
              onChange={handleCategoryChange}
            />
          </div>
        )}

        {/* Status Filter - show only for active questions view */}
        {!showForm && !showArchived && (
          <div className="mb-6">
            <StatusFilter
              value={statusFilter}
              counts={counts}
              onChange={handleFilterChange}
            />
          </div>
        )}

        {/* Questions List or Archived List */}
        {!showForm && (showArchived ? (
          <ArchivedQuestionsList />
        ) : (
          <QuestionsList
            questions={questions}
            isLoading={isLoading}
            error={error}
            viewMode={categoryFilter === 'all' ? 'grouped' : 'flat'}
            renderEmptyState={renderEmptyState}
          />
        ))}
      </div>
    </main>
  );
}
