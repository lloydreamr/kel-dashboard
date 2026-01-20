'use client';

/**
 * PitchSectionCard Component
 *
 * Card displaying a pitch section with AI-generated or user-edited content.
 * Includes confidence badge, source attribution, and edit/regenerate controls.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 *
 * @example
 * ```tsx
 * <PitchSectionCard
 *   section={sectionWithSources}
 *   pitchDraftId="uuid"
 *   onEdit={(content) => console.log(content)}
 * />
 * ```
 */

import { useState } from 'react';
import { Edit2, Check, X, Sparkles, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { GenerateContentButton } from './GenerateContentButton';
import { ConfidenceBadge } from './ConfidenceBadge';
import { SourcesList } from './SourcesList';
import { useUpdatePitchSection } from '@/hooks/pitch';
import {
  SECTION_TYPE_LABELS,
  SECTION_TYPE_DESCRIPTIONS,
} from '@/types/pitch';

import type { PitchSectionWithSources, PitchSectionType } from '@/types/pitch';

interface PitchSectionCardProps {
  /** Section data with sources */
  section: PitchSectionWithSources;
  /** Pitch draft ID for regeneration */
  pitchDraftId: string;
  /** Optional callback when content is edited */
  onEdit?: (content: string) => void;
  /** Whether to show edit controls */
  editable?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Card displaying a pitch section with content and metadata.
 * Supports inline editing and AI regeneration.
 */
export function PitchSectionCard({
  section,
  pitchDraftId,
  onEdit,
  editable = true,
  className,
}: PitchSectionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(section.content);
  const updateSection = useUpdatePitchSection();

  const sectionType = section.section_type as PitchSectionType;
  const label = SECTION_TYPE_LABELS[sectionType];
  const description = SECTION_TYPE_DESCRIPTIONS[sectionType];

  const handleSave = () => {
    if (editedContent !== section.content) {
      updateSection.mutate(
        {
          id: section.id,
          updates: { content: editedContent, user_edited: true },
          pitchDraftId,
        },
        {
          onSuccess: () => {
            setIsEditing(false);
            onEdit?.(editedContent);
          },
        }
      );
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(section.content);
    setIsEditing(false);
  };

  return (
    <Card className={className} data-testid={`pitch-section-${sectionType}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {label}
              {section.ai_generated && (
                <Badge variant="secondary" className="text-xs font-normal">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Generated
                </Badge>
              )}
              {section.user_edited && (
                <Badge variant="outline" className="text-xs font-normal">
                  <User className="h-3 w-3 mr-1" />
                  Edited
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <ConfidenceBadge score={section.confidence_score} />
            {editable && (
              <GenerateContentButton
                pitchDraftId={pitchDraftId}
                sectionType={sectionType}
                hasExistingContent={!!section.content}
              />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[200px] resize-y"
              placeholder="Enter pitch content..."
              data-testid="section-content-editor"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={updateSection.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateSection.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                {updateSection.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              data-testid="section-content"
            >
              {section.content ? (
                <div className="whitespace-pre-wrap">{section.content}</div>
              ) : (
                <p className="text-muted-foreground italic">
                  No content yet. Click "Generate" to create AI-powered content.
                </p>
              )}
            </div>

            {editable && section.content && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit Content
              </Button>
            )}
          </div>
        )}

        {section.sources.length > 0 && (
          <SourcesList sources={section.sources} />
        )}
      </CardContent>
    </Card>
  );
}
