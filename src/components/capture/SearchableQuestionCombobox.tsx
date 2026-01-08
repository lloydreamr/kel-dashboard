'use client';

/**
 * SearchableQuestionCombobox Component
 *
 * A searchable dropdown for selecting questions with virtualization support.
 * Replaces the basic Select component in QuickCaptureSheet for better UX
 * with 500+ questions.
 *
 * Story 13.1: Searchable Question Dropdown (BUG-004)
 *
 * Features:
 * - Search input with 150ms debounce (AC #2, #3)
 * - Recent questions section (AC #4)
 * - Virtualized list keeping DOM < 50 items (AC #5)
 * - Category grouping (AC #6)
 * - Keyboard navigation (AC #8)
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebouncedValue } from '@/hooks/ui';
import { cn } from '@/lib/utils';
import { CATEGORY_LABELS, type QuestionCategory } from '@/types/question';

import { useRecentQuestions } from './useRecentQuestions';

/** Minimal question info needed for the selector */
export interface QuestionOption {
  id: string;
  title: string;
  category: QuestionCategory;
}

interface SearchableQuestionComboboxProps {
  /** Available questions to select from */
  questions: QuestionOption[];
  /** Currently selected question ID (null for "None") */
  value: string | null;
  /** Callback when selection changes */
  onSelect: (questionId: string | null) => void;
  /** Placeholder text for the trigger button */
  placeholder?: string;
  /** Test ID prefix for testing */
  testIdPrefix?: string;
}

/** Virtual list item types */
type VirtualItem =
  | { type: 'none' }
  | { type: 'header'; label: string; category: string }
  | { type: 'question'; question: QuestionOption };

/** Estimated heights for virtual items */
const ITEM_HEIGHT = 40;
const HEADER_HEIGHT = 32;
const OVERSCAN = 5;

/** Maximum items to display in Recent section */
const MAX_RECENT_DISPLAY = 5;

/** Category order for display */
const CATEGORY_ORDER: QuestionCategory[] = ['market', 'product', 'distribution'];

/** Category colors matching QuickCaptureSheet */
const CATEGORY_COLORS: Record<QuestionCategory, string> = {
  market: 'bg-blue-500',
  product: 'bg-green-500',
  distribution: 'bg-orange-500',
};

export function SearchableQuestionCombobox({
  questions,
  value,
  onSelect,
  placeholder = 'Select a question',
  testIdPrefix = 'question-combobox',
}: SearchableQuestionComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const debouncedSearch = useDebouncedValue(search, 150);
  const { recentIds, addRecent } = useRecentQuestions();

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find selected question for display
  const selectedQuestion = useMemo(
    () => questions.find((q) => q.id === value),
    [questions, value]
  );

  // Filter questions by search term (case-insensitive substring match)
  const filteredQuestions = useMemo(() => {
    if (!debouncedSearch.trim()) return questions;
    const searchLower = debouncedSearch.toLowerCase();
    return questions.filter((q) => q.title.toLowerCase().includes(searchLower));
  }, [questions, debouncedSearch]);

  // Build virtual items list with headers and questions
  const virtualItems = useMemo<VirtualItem[]>(() => {
    const items: VirtualItem[] = [];

    // Always add "None" option first
    items.push({ type: 'none' });

    const isSearching = debouncedSearch.trim().length > 0;

    // Add recent section if not searching and has recent items
    if (!isSearching && recentIds.length > 0) {
      const recentQuestions = recentIds
        .slice(0, MAX_RECENT_DISPLAY)
        .map((id) => questions.find((q) => q.id === id))
        .filter((q): q is QuestionOption => q !== undefined);

      if (recentQuestions.length > 0) {
        items.push({ type: 'header', label: 'Recent', category: 'recent' });
        recentQuestions.forEach((q) => items.push({ type: 'question', question: q }));
      }
    }

    // Group filtered questions by category
    const grouped: Record<QuestionCategory, QuestionOption[]> = {
      market: [],
      product: [],
      distribution: [],
    };

    filteredQuestions.forEach((q) => {
      grouped[q.category].push(q);
    });

    // Add category sections
    CATEGORY_ORDER.forEach((category) => {
      const categoryQuestions = grouped[category];
      if (categoryQuestions.length > 0) {
        items.push({
          type: 'header',
          label: CATEGORY_LABELS[category],
          category,
        });
        categoryQuestions.forEach((q) => items.push({ type: 'question', question: q }));
      }
    });

    return items;
  }, [questions, filteredQuestions, debouncedSearch, recentIds]);

  // Virtualizer setup
  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => listRef.current,
    estimateSize: (index) => {
      const item = virtualItems[index];
      return item.type === 'header' ? HEADER_HEIGHT : ITEM_HEIGHT;
    },
    overscan: OVERSCAN,
  });

  // Get only selectable indices (non-headers)
  const selectableIndices = useMemo(
    () =>
      virtualItems
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.type !== 'header')
        .map(({ index }) => index),
    [virtualItems]
  );

  // Handle selection
  const handleSelect = useCallback(
    (questionId: string | null) => {
      if (questionId) {
        addRecent(questionId);
      }
      onSelect(questionId);
      setOpen(false);
      setSearch('');
    },
    [onSelect, addRecent]
  );

  // Handle item click
  const handleItemClick = useCallback(
    (item: VirtualItem) => {
      if (item.type === 'none') {
        handleSelect(null);
      } else if (item.type === 'question') {
        handleSelect(item.question.id);
      }
    },
    [handleSelect]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentSelectableIndex = selectableIndices.indexOf(highlightedIndex);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentSelectableIndex < selectableIndices.length - 1) {
            const nextIndex = selectableIndices[currentSelectableIndex + 1];
            setHighlightedIndex(nextIndex);
            virtualizer.scrollToIndex(nextIndex, { align: 'auto' });
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (currentSelectableIndex > 0) {
            const prevIndex = selectableIndices[currentSelectableIndex - 1];
            setHighlightedIndex(prevIndex);
            virtualizer.scrollToIndex(prevIndex, { align: 'auto' });
          }
          break;

        case 'Enter':
          e.preventDefault();
          const selectedItem = virtualItems[highlightedIndex];
          if (selectedItem) {
            handleItemClick(selectedItem);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setOpen(false);
          setSearch('');
          break;
      }
    },
    [highlightedIndex, selectableIndices, virtualItems, handleItemClick, virtualizer]
  );

  // Reset highlight when items change
  useEffect(() => {
    if (selectableIndices.length > 0) {
      setHighlightedIndex(selectableIndices[0]);
    }
  }, [selectableIndices]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      // Small delay to ensure popover is mounted
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Check if we have search results
  const hasNoResults =
    debouncedSearch.trim().length > 0 &&
    virtualItems.filter((item) => item.type === 'question').length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className="w-full justify-between font-normal"
          data-testid={`${testIdPrefix}-trigger`}
        >
          {selectedQuestion ? (
            <span className="flex items-center gap-2 truncate">
              <span
                className={cn(
                  'inline-block h-2 w-2 shrink-0 rounded-full',
                  CATEGORY_COLORS[selectedQuestion.category]
                )}
              />
              <span className="truncate">{selectedQuestion.title}</span>
            </span>
          ) : value === null ? (
            <span className="text-muted-foreground">None (unattached)</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            data-testid={`${testIdPrefix}-search`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="ml-2 rounded p-1 hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="h-3 w-3 opacity-50" />
            </button>
          )}
        </div>

        {/* Virtualized list */}
        <div
          ref={listRef}
          className="max-h-[300px] overflow-auto"
          role="listbox"
          data-testid={`${testIdPrefix}-list`}
        >
          {hasNoResults ? (
            <div
              className="py-6 text-center text-sm text-muted-foreground"
              data-testid={`${testIdPrefix}-empty`}
            >
              No matching questions
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const item = virtualItems[virtualRow.index];
                const isHighlighted = virtualRow.index === highlightedIndex;

                if (item.type === 'header') {
                  return (
                    <div
                      key={`header-${item.category}`}
                      data-testid={`${testIdPrefix}-header-${item.category}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="flex items-center px-3 text-xs font-semibold text-muted-foreground"
                    >
                      {item.label}
                    </div>
                  );
                }

                if (item.type === 'none') {
                  const isSelected = value === null;
                  return (
                    <div
                      key="none"
                      role="option"
                      aria-selected={isSelected}
                      data-testid={`${testIdPrefix}-none`}
                      onClick={() => handleItemClick(item)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className={cn(
                        'flex cursor-pointer items-center px-3 py-2',
                        isHighlighted && 'bg-accent',
                        isSelected && 'bg-accent/50'
                      )}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="text-muted-foreground">None (unattached)</span>
                    </div>
                  );
                }

                // Question item
                const isSelected = value === item.question.id;
                return (
                  <div
                    key={item.question.id}
                    role="option"
                    aria-selected={isSelected}
                    data-testid={`${testIdPrefix}-option-${item.question.id}`}
                    onClick={() => handleItemClick(item)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={cn(
                      'flex cursor-pointer items-center px-3 py-2',
                      isHighlighted && 'bg-accent',
                      isSelected && 'bg-accent/50'
                    )}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span
                      className={cn(
                        'mr-2 inline-block h-2 w-2 shrink-0 rounded-full',
                        CATEGORY_COLORS[item.question.category]
                      )}
                    />
                    <span className="truncate" title={item.question.title}>
                      {item.question.title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
