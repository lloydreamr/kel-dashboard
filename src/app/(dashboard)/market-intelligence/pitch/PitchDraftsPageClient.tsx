'use client';

/**
 * PitchDraftsPageClient Component
 *
 * Client component for pitch drafts list page.
 * Displays existing drafts and allows creating new ones.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Plus,
  FileText,
  Sparkles,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Edit2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MiBreadcrumb } from '@/components/market-intelligence';
import {
  usePitchDrafts,
  useCreatePitchDraft,
  useDeletePitchDraft,
} from '@/hooks/pitch';
import {
  TEMPLATE_TYPE_LABELS,
  PITCH_TEMPLATE_TYPES,
} from '@/types/pitch';

import type { PitchDraft } from '@/types/database';
import type { PitchTemplateType, PitchDraftStatus } from '@/types/pitch';

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
  draft: PitchDraft;
  onDelete: (id: string) => void;
}) {
  const status = draft.status as PitchDraftStatus;
  const templateType = draft.template_type as PitchTemplateType;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <CardTitle className="text-base truncate">{draft.title}</CardTitle>
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
          <p className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/market-intelligence/pitch/${draft.id}`}>
              Open
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
  const createDraft = useCreatePitchDraft();

  const handleCreate = () => {
    if (!title.trim()) return;
    createDraft.mutate(
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
      <DialogContent>
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
          <div className="space-y-2">
            <Label htmlFor="template">Template (optional)</Label>
            <Select
              value={templateType ?? 'none'}
              onValueChange={(v) => setTemplateType(v === 'none' ? null : v as NonNullable<PitchTemplateType>)}
            >
              <SelectTrigger id="template" data-testid="pitch-template-select">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template</SelectItem>
                {PITCH_TEMPLATE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {TEMPLATE_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || createDraft.isPending}
            data-testid="create-pitch-submit"
          >
            {createDraft.isPending ? 'Creating...' : 'Create Pitch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Main pitch drafts page client
 */
export function PitchDraftsPageClient() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: drafts, isLoading, error } = usePitchDrafts();
  const deleteDraft = useDeletePitchDraft();

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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drafts?.map((draft) => (
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
