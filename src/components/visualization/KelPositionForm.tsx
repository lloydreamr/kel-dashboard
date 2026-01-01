/**
 * KelPositionForm Component
 *
 * Simplified form for setting/updating Kel's target position on the chart.
 * Only includes price/quality scores and optional notes.
 * No name or category fields (those are handled automatically).
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useSetKelPosition } from '@/hooks/competitors';

import { kelPositionFormSchema, type KelPositionFormData } from './kelPositionSchema';

import type { CompetitorDataPoint } from '@/types';

interface KelPositionFormProps {
  defaultValues?: CompetitorDataPoint; // Existing Kel position for editing
  onSuccess: () => void;
  onCancel: () => void;
}

export function KelPositionForm({ defaultValues, onSuccess, onCancel }: KelPositionFormProps) {
  const [priceScore, setPriceScore] = useState(defaultValues?.price_score ?? 5);
  const [qualityScore, setQualityScore] = useState(defaultValues?.quality_score ?? 5);

  const form = useForm<KelPositionFormData>({
    resolver: zodResolver(kelPositionFormSchema),
    mode: 'onChange', // Show validation errors immediately for better UX
    defaultValues: {
      price_score: defaultValues?.price_score ?? 5,
      quality_score: defaultValues?.quality_score ?? 5,
      notes: defaultValues?.notes ?? null,
    },
  });

  const setKelPositionMutation = useSetKelPosition();
  const isPending = setKelPositionMutation.isPending;

  // Sync slider state when editing existing position
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setPriceScore(defaultValues?.price_score ?? 5);
    setQualityScore(defaultValues?.quality_score ?? 5);
  }, [defaultValues?.price_score, defaultValues?.quality_score]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = (data: KelPositionFormData) => {
    setKelPositionMutation.mutate(data, { onSuccess });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} data-testid="kel-position-form" className="space-y-6">
      {/* Price Score Slider */}
      <div className="space-y-2">
        <Label htmlFor="kel_price_score">Price Score: {priceScore}</Label>
        <Slider
          id="kel_price_score"
          data-testid="kel-price-input"
          aria-label={`Price score, currently ${priceScore} out of 10`}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={priceScore}
          min={1}
          max={10}
          step={1}
          value={[priceScore]}
          onValueChange={(value) => {
            setPriceScore(value[0]);
            form.setValue('price_score', value[0], { shouldValidate: true });
          }}
          className="min-h-[48px]"
        />
        {form.formState.errors.price_score && (
          <p className="text-sm text-destructive">{form.formState.errors.price_score.message}</p>
        )}
      </div>

      {/* Quality Score Slider */}
      <div className="space-y-2">
        <Label htmlFor="kel_quality_score">Quality Score: {qualityScore}</Label>
        <Slider
          id="kel_quality_score"
          data-testid="kel-quality-input"
          aria-label={`Quality score, currently ${qualityScore} out of 10`}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={qualityScore}
          min={1}
          max={10}
          step={1}
          value={[qualityScore]}
          onValueChange={(value) => {
            setQualityScore(value[0]);
            form.setValue('quality_score', value[0], { shouldValidate: true });
          }}
          className="min-h-[48px]"
        />
        {form.formState.errors.quality_score && (
          <p className="text-sm text-destructive">{form.formState.errors.quality_score.message}</p>
        )}
      </div>

      {/* Notes Textarea */}
      <div className="space-y-2">
        <Label htmlFor="kel_notes">Notes (optional)</Label>
        <Textarea
          id="kel_notes"
          data-testid="kel-notes-input"
          placeholder="Notes about this target position..."
          {...form.register('notes')}
          className="min-h-[48px]"
          rows={3}
        />
        {form.formState.errors.notes && (
          <p className="text-sm text-destructive">{form.formState.errors.notes.message}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="min-h-[48px] min-w-[100px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!form.formState.isValid || isPending}
          className="min-h-[48px] min-w-[120px]"
          data-testid="kel-position-submit"
        >
          {isPending ? 'Saving...' : 'Set Position'}
        </Button>
      </div>
    </form>
  );
}
