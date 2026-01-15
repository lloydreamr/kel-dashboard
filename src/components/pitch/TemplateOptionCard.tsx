'use client';

/**
 * TemplateOptionCard Component
 *
 * A selectable card for pitch template options.
 * Displays template name, description, and section preview.
 *
 * Story 18-4: Pitch Template Library
 */

import { FileText, Sparkles, Building2, Map, Users } from 'lucide-react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SECTION_TYPE_LABELS } from '@/types/pitch';

import type { PitchTemplateConfig } from '@/lib/pitch';

// ============================================================================
// Types
// ============================================================================

interface TemplateOptionCardProps {
  /** Template configuration (null for custom/no template) */
  template: PitchTemplateConfig | null;
  /** Whether this option is selected */
  selected: boolean;
  /** Value for the radio group */
  value: string;
}

// ============================================================================
// Icon Mapping
// ============================================================================

/**
 * Get icon for template type
 */
function getTemplateIcon(templateId: string | null) {
  switch (templateId) {
    case 'mid_size':
      return Building2;
    case 'regional':
      return Map;
    case 'wofex_booth':
      return Users;
    default:
      return Sparkles;
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * Template option card for selection UI.
 * Uses RadioGroupPrimitive.Item for proper accessibility.
 */
export function TemplateOptionCard({
  template,
  selected,
  value,
}: TemplateOptionCardProps) {
  const Icon = getTemplateIcon(template?.id ?? null);

  return (
    <RadioGroupPrimitive.Item
      value={value}
      className={cn(
        'relative flex flex-col items-start gap-3 rounded-lg border-2 p-4 transition-colors',
        'min-h-[120px] cursor-pointer',
        // 48px touch target ensured by min-height and padding
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-muted hover:border-primary/50 hover:bg-muted/50'
      )}
      data-testid={`template-option-${value}`}
    >
      {/* Header with icon and name */}
      <div className="flex items-start justify-between w-full gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-semibold text-sm truncate">
              {template?.name ?? 'Custom Pitch'}
            </span>
            {template && (
              <span className="text-xs text-muted-foreground truncate">
                {template.targetAudience}
              </span>
            )}
          </div>
        </div>
        {/* Selection indicator */}
        <div
          className={cn(
            'h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center',
            selected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
          )}
        >
          {selected && <div className="h-2 w-2 rounded-full bg-white" />}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2">
        {template?.description ?? 'Start from scratch with no pre-defined sections or template guidance.'}
      </p>

      {/* Section preview (for templates) */}
      {template && template.sections.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {template.sections.map((section) => (
            <Badge
              key={section.type}
              variant="secondary"
              className="text-[10px] px-1.5 py-0.5"
            >
              <FileText className="h-2.5 w-2.5 mr-1" />
              {SECTION_TYPE_LABELS[section.type]}
            </Badge>
          ))}
        </div>
      )}

      {/* Tone indicator */}
      {template && (
        <div className="flex items-center gap-1.5 mt-auto pt-1">
          <span className="text-[10px] text-muted-foreground">Tone:</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
            {template.defaultTone}
          </Badge>
        </div>
      )}
    </RadioGroupPrimitive.Item>
  );
}
