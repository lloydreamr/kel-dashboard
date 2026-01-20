'use client';

/**
 * PitchDraftsPageClient Component
 *
 * Client component for pitch drafts list page.
 * Displays existing drafts and allows creating new ones.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import { formatDistanceToNow } from 'date-fns';
import {
  Plus,
  FileText,
  Sparkles,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Edit2,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';

import { MiBreadcrumb } from '@/components/market-intelligence';
import { cn } from '@/lib/utils';
import { TemplateOptionCard } from '@/components/pitch/TemplateOptionCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup } from '@/components/ui/radio-group';
import {
  usePitchDrafts,
  useCreatePitchWithTemplate,
  useDeletePitchDraft,
} from '@/hooks/pitch';
import { ALL_TEMPLATES } from '@/lib/pitch';
import { TEMPLATE_TYPE_LABELS, PITCH_AI_SECTION_TYPES } from '@/types/pitch';

import type { PitchTemplateType, PitchDraftStatus, PitchDraftWithSectionCount } from '@/types/pitch';

/** Total number of AI-generatable sections */
const TOTAL_SECTIONS = PITCH_AI_SECTION_TYPES.length;

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
  ready: 'Ready',
  exported: 'Exported',
};

/**
 * Single pitch draft card
 */
function PitchDraftCard({
  draft,
  onDelete,
}: {
  draft: PitchDraftWithSectionCount;
  onDelete: (id: string) => void;
}) {
  const status = draft.status as PitchDraftStatus;
  const templateType = draft.template_type as PitchTemplateType;
  const sectionCount = draft.section_count;
  const isEmpty = sectionCount === 0;

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${isEmpty ? 'opacity-75' : ''}`}
      data-testid="pitch-draft-card"
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileText className={`h-4 w-4 flex-shrink-0 ${isEmpty ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />
              <CardTitle className={`text-base truncate ${isEmpty ? 'text-muted-foreground' : ''}`}>
                {draft.title}
              </CardTitle>
            </div>
            {templateType && (
              <CardDescription className="text-xs">
                {TEMPLATE_TYPE_LABELS[templateType]}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant="outline"
              className={STATUS_COLORS[status]}
            >
              {STATUS_LABELS[status]}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/market-intelligence/pitch/${draft.id}`}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(draft.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Section progress indicator */}
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {Array.from({ length: TOTAL_SECTIONS }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < sectionCount
                        ? 'bg-primary'
                        : 'bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs ${isEmpty ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                {sectionCount}/{TOTAL_SECTIONS}
              </span>
            </div>
            <span className="text-muted-foreground/30">•</span>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/market-intelligence/pitch/${draft.id}`}>
              {isEmpty ? 'Start' : 'Open'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Create pitch dialog
 */
function CreatePitchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [title, setTitle] = useState('');
  const [templateType, setTemplateType] = useState<PitchTemplateType>(null);
  const createPitch = useCreatePitchWithTemplate();

  const handleCreate = () => {
    if (!title.trim()) return;
    createPitch.mutate(
      { title: title.trim(), template_type: templateType },
      {
        onSuccess: () => {
          setTitle('');
          setTemplateType(null);
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Pitch Draft</DialogTitle>
          <DialogDescription>
            Create a new pitch draft to generate AI-powered content for distributor presentations.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., EFC Distributor Pitch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="pitch-title-input"
            />
          </div>
          <div className="space-y-3">
            <Label>Template</Label>
            <RadioGroup
              value={templateType ?? 'none'}
              onValueChange={(v) => setTemplateType(v === 'none' ? null : v as NonNullable<PitchTemplateType>)}
              className="grid gap-3"
              data-testid="pitch-template-select"
            >
              {/* Custom option */}
              <TemplateOptionCard
                template={null}
                selected={templateType === null}
                value="none"
              />
              {/* Template options */}
              {ALL_TEMPLATES.map((template) => (
                <TemplateOptionCard
                  key={template.id}
                  template={template}
                  selected={templateType === template.id}
                  value={template.id}
                />
              ))}
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || createPitch.isPending}
            data-testid="create-pitch-submit"
          >
            {createPitch.isPending ? 'Creating...' : 'Create Pitch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Template filter value type
 * 'all' shows everything, 'custom' shows null templates, others filter by template
 */
type TemplateFilterValue = 'all' | 'custom' | NonNullable<PitchTemplateType>;

/**
 * Filter labels for display
 */
const FILTER_LABELS: Record<TemplateFilterValue, string> = {
  all: 'All',
  custom: 'Custom',
  mid_size: 'Mid-Size',
  regional: 'Regional',
  wofex_booth: 'WOFEX',
};

/**
 * Main pitch drafts page client
 */
export function PitchDraftsPageClient() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState<TemplateFilterValue>('all');
  const { data: drafts, isLoading, error } = usePitchDrafts();
  const deleteDraft = useDeletePitchDraft();

  // Filter drafts by template type
  const filteredDrafts = drafts?.filter((draft) => {
    if (templateFilter === 'all') return true;
    if (templateFilter === 'custom') return draft.template_type === null;
    return draft.template_type === templateFilter;
  });

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteDraft.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <MiBreadcrumb current="Pitch Drafts" />
        <div className="animate-pulse space-y-4 mt-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <MiBreadcrumb current="Pitch Drafts" />
        <div className="mt-8 rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            Failed to load pitch drafts. Please try again.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-7xl" data-testid="pitch-drafts-page">
      <MiBreadcrumb current="Pitch Drafts" />

      <div className="flex items-center justify-between mt-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pitch Drafts</h1>
          <p className="text-muted-foreground mt-1">
            Create AI-powered content for distributor presentations
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="create-pitch-button">
          <Plus className="h-4 w-4 mr-2" />
          New Pitch
        </Button>
      </div>

      {/* Template filter */}
      {drafts && drafts.length > 0 && (
        <div className="flex items-center gap-2 mb-4" data-testid="template-filter">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1">
            {(Object.keys(FILTER_LABELS) as TemplateFilterValue[]).map((key) => (
              <Button
                key={key}
                variant={templateFilter === key ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTemplateFilter(key)}
                className={cn(
                  'text-sm h-8',
                  templateFilter === key && 'bg-secondary'
                )}
                data-testid={`filter-${key}`}
              >
                {FILTER_LABELS[key]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {drafts?.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No pitch drafts yet</h2>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Create your first pitch draft to start generating AI-powered content
              for distributor presentations.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Pitch
            </Button>
          </CardContent>
        </Card>
      ) : filteredDrafts?.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground text-center">
              No drafts match the selected filter.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setTemplateFilter('all')}
            >
              Clear filter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrafts?.map((draft) => (
            <PitchDraftCard
              key={draft.id}
              draft={draft}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreatePitchDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pitch Draft</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this pitch draft? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteDraft.isPending}
            >
              {deleteDraft.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
