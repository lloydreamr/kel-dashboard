'use client';

/**
 * CommandPalette Component
 *
 * Command palette dialog (Cmd/Ctrl+K) for global search.
 * Uses cmdk for keyboard navigation and shadcn/ui for styling.
 * Debounces search input (300ms) to avoid excessive queries.
 */

import { Building2, FileText, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGlobalSearch } from '@/hooks/market-intelligence';

import type { GlobalSearchResult } from '@/lib/repositories';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { results, isLoading } = useGlobalSearch(debouncedQuery);

  // Debounce query changes (300ms)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Handle open change and clear query when closing
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setQuery('');
        setDebouncedQuery('');
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  const handleSelect = useCallback(
    (result: GlobalSearchResult) => {
      handleOpenChange(false);
      router.push(result.href);
    },
    [handleOpenChange, router]
  );

  const hasResults =
    results &&
    (results.companies.length > 0 ||
      results.products.length > 0 ||
      results.research.length > 0);

  // Track if we're waiting for debounce to settle
  const isPending = query !== debouncedQuery && query.trim().length >= 2;
  const showLoading = isLoading || isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-testid="mi-command-palette"
        className="overflow-hidden p-0 shadow-lg"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Search knowledge base</DialogTitle>
        <DialogDescription className="sr-only">
          Search for companies, products, and research documents
        </DialogDescription>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput
            data-testid="mi-command-input"
            placeholder="Search companies, products, research..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {/* Loading state (includes debounce pending) */}
            {showLoading && query.length >= 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}

            {/* Empty state */}
            {!showLoading && query.length >= 2 && !hasResults && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}

            {/* Placeholder when no query */}
            {query.length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type to search...
              </div>
            )}

            {/* Companies */}
            {results && results.companies.length > 0 && (
              <CommandGroup heading="Companies">
                {results.companies.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`company-${item.name}`}
                    onSelect={() => handleSelect(item)}
                    className="min-h-[48px]"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Products */}
            {results && results.products.length > 0 && (
              <CommandGroup heading="Products">
                {results.products.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`product-${item.name}`}
                    onSelect={() => handleSelect(item)}
                    className="min-h-[48px]"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Research */}
            {results && results.research.length > 0 && (
              <CommandGroup heading="Research">
                {results.research.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`research-${item.name}`}
                    onSelect={() => handleSelect(item)}
                    className="min-h-[48px]"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
