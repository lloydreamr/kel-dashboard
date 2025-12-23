'use client';

/**
 * CategoryBadge Component
 *
 * Interactive category badge that allows Maho to reassign question category.
 * Shows dropdown with category options for Maho, static badge for Kel.
 */

import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUpdateQuestion } from '@/hooks/questions/useUpdateQuestion';
import { QUESTION_CATEGORIES, type QuestionCategory } from '@/types/question';

interface CategoryBadgeProps {
  questionId: string;
  category: QuestionCategory;
  isEditable: boolean;
}

export function CategoryBadge({
  questionId,
  category,
  isEditable,
}: CategoryBadgeProps) {
  const { mutate: updateQuestion, isPending } = useUpdateQuestion();
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryChange = (newCategory: QuestionCategory) => {
    if (newCategory === category) {
      setIsOpen(false);
      return;
    }

    updateQuestion(
      {
        id: questionId,
        updates: { category: newCategory },
      },
      {
        onSuccess: () => {
          // Toast handled by useUpdateQuestion hook
          setIsOpen(false);
        },
        onError: () => {
          // Error toast handled by useUpdateQuestion hook
          // Just close dropdown on error
        },
      }
    );
  };

  // Static badge for non-editable (Kel) or pending state
  if (!isEditable) {
    return (
      <span
        data-testid="category-badge"
        className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground capitalize"
      >
        {category}
      </span>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild disabled={isPending}>
        <button
          data-testid="category-badge"
          className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-2 text-xs font-medium text-muted-foreground capitalize hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[48px] disabled:opacity-50"
        >
          {isPending ? 'Updating...' : category}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-testid="category-dropdown"
        align="start"
        className="w-40"
      >
        {QUESTION_CATEGORIES.map((cat) => (
          <DropdownMenuItem
            key={cat}
            data-testid={`category-option-${cat}`}
            onClick={() => handleCategoryChange(cat)}
            className="capitalize min-h-[44px] cursor-pointer"
          >
            <span className="flex-1">{cat}</span>
            {cat === category && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
