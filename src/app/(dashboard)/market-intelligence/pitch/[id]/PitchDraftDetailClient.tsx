'use client';

/**
 * PitchDraftDetailClient Component
 *
 * Client component for viewing and editing a pitch draft.
 * Core UI for AI-assisted content generation.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, FileDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MiBreadcrumb } from '@/components/market-intelligence';
import {
  PitchSectionCard,
  PitchSectionEmptyState,
  GenerateAllSectionsButton,
} from '@/components/pitch';
import {
  usePitchDraft,
  usePitchSections,
  useUpdatePitchDraft,
  useUpdatePitchDraftStatus,
} from '@/hooks/pitch';
import {
  PITCH_SECTION_TYPES,
  PITCH_DRAFT_STATUSES,
} from '@/types/pitch';

import type { PitchSectionType, PitchDraftStatus, PitchSectionWithSources } from '@/types/pitch';

interface PitchDraftDetailClientProps {
  pitchDraftId: string;
}

/**
 * Status badge colors
 */
const STATUS_COLORS: Record<PitchDraftStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  exported: 'bg-blue-100 text-blue-800 border-blue-200',
};

/**
 * Status labels
 */
const STATUS_LABELS: Record<PitchDraftStatus, string> = {
  draft: 'Draft',
  ready: 'Ready for Export',
  exported: 'Exported',
};

/**
 * Main pitch draft detail client
 */
export function PitchDraftDetailClient({ pitchDraftId }: PitchDraftDetailClientProps) {
  const router = useRouter();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  const { data: draft, isLoading: draftLoading, error: draftError } = usePitchDraft(pitchDraftId);
  const { data: sections, isLoading: sectionsLoading } = usePitchSections(pitchDraftId, {
    withSources: true,
  });
  const updateDraft = useUpdatePitchDraft();
  const updateStatus = useUpdatePitchDraftStatus();

  const isLoading = draftLoading || sectionsLoading;

  // Build a map of section type to section data
  const sectionMap = new Map<PitchSectionType, PitchSectionWithSources>();
  if (sections) {
    for (const section of sections as PitchSectionWithSources[]) {
      sectionMap.set(section.section_type as PitchSectionType, section);
    }
  }

  // Get existing section types for the "Generate All" button
  const existingSectionTypes = Array.from(sectionMap.keys());

  const handleTitleEdit = () => {
    if (draft) {
      setEditedTitle(draft.title);
      setIsEditingTitle(true);
    }
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== draft?.title) {
      updateDraft.mutate(
        { id: pitchDraftId, updates: { title: editedTitle.trim() } },
        { onSuccess: () => setIsEditingTitle(false) }
      );
    } else {
      setIsEditingTitle(false);
    }
  };

  const handleStatusChange = (newStatus: PitchDraftStatus) => {
    updateStatus.mutate({ id: pitchDraftId, status: newStatus });
  };

  // Loading state - skeleton per project rules (never spinners)
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <MiBreadcrumb
          items={[{ label: 'Pitch Drafts', href: '/market-intelligence/pitch' }]}
          current="Loading..."
        />
        <div className="animate-pulse space-y-6 mt-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-muted rounded" />
              <div className="h-8 w-32 bg-muted rounded" />
            </div>
          </div>
          {/* Section cards skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-muted rounded" />
                  <div className="h-4 w-64 bg-muted rounded" />
                </div>
                <div className="h-6 w-16 bg-muted rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  // Error state
  if (draftError || !draft) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <MiBreadcrumb
          items={[{ label: 'Pitch Drafts', href: '/market-intelligence/pitch' }]}
          current="Error"
        />
        <div className="mt-8 rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive mb-4">
            Failed to load pitch draft. It may have been deleted.
          </p>
          <Button variant="outline" onClick={() => router.push('/market-intelligence/pitch')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pitch Drafts
          </Button>
        </div>
      </main>
    );
  }

  const status = draft.status as PitchDraftStatus;

  return (
    <main className="container mx-auto px-4 py-6 max-w-4xl" data-testid="pitch-draft-detail">
      <MiBreadcrumb
        items={[{ label: 'Pitch Drafts', href: '/market-intelligence/pitch' }]}
        current={draft.title}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 mt-6 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                className="text-2xl font-bold h-auto py-1"
                autoFocus
                data-testid="pitch-title-edit-input"
              />
            </div>
          ) : (
            <h1
              className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
              onClick={handleTitleEdit}
              title="Click to edit"
              data-testid="pitch-title"
            >
              {draft.title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className={STATUS_COLORS[status]}>
            {STATUS_LABELS[status]}
          </Badge>

          <GenerateAllSectionsButton
            pitchDraftId={pitchDraftId}
            existingSections={existingSectionTypes}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm font-medium">Status</div>
              {PITCH_DRAFT_STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={s === status ? 'bg-accent' : ''}
                >
                  {STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF (coming soon)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Pitch Sections */}
      <div className="space-y-6">
        {PITCH_SECTION_TYPES.map((sectionType) => {
          const section = sectionMap.get(sectionType);
          return section ? (
            <PitchSectionCard
              key={sectionType}
              section={section}
              pitchDraftId={pitchDraftId}
            />
          ) : (
            <PitchSectionEmptyState
              key={sectionType}
              pitchDraftId={pitchDraftId}
              sectionType={sectionType}
            />
          );
        })}
      </div>
    </main>
  );
}
