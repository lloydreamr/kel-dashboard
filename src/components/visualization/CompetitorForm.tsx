'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCompetitor, useUpdateCompetitor } from '@/hooks/competitors';

import { competitorFormSchema, COMPETITOR_CATEGORIES, type CompetitorFormData } from './competitorSchema';

import type { CompetitorDataPoint } from '@/types';

interface CompetitorFormProps {
  mode: 'create' | 'edit';
  defaultValues?: CompetitorDataPoint;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CompetitorForm({ mode, defaultValues, onSuccess, onCancel }: CompetitorFormProps) {
  const [priceScore, setPriceScore] = useState(defaultValues?.price_score ?? 5);
  const [qualityScore, setQualityScore] = useState(defaultValues?.quality_score ?? 5);

  const form = useForm({
    resolver: zodResolver(competitorFormSchema),
    defaultValues: defaultValues ? {
      name: defaultValues.name,
      price_score: defaultValues.price_score,
      quality_score: defaultValues.quality_score,
      category: defaultValues.category as CompetitorFormData['category'],
      notes: defaultValues.notes,
      is_kel_position: defaultValues.is_kel_position ?? false,
    } : {
      name: '',
      price_score: 5,
      quality_score: 5,
      category: null,
      notes: null,
      is_kel_position: false,
    },
  });

  const createMutation = useCreateCompetitor();
  const updateMutation = useUpdateCompetitor();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Sync slider state when defaultValues changes (mode switch or new competitor)
  useEffect(() => {
    setPriceScore(defaultValues?.price_score ?? 5);
    setQualityScore(defaultValues?.quality_score ?? 5);
  }, [defaultValues?.price_score, defaultValues?.quality_score]);

  const onSubmit = (data: CompetitorFormData) => {
    if (mode === 'create') {
      createMutation.mutate(data, { onSuccess });
    } else if (defaultValues?.id) {
      updateMutation.mutate({ id: defaultValues.id, input: data }, { onSuccess });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} data-testid="competitor-form" className="space-y-6">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          data-testid="competitor-name-input"
          placeholder="Competitor name"
          error={!!form.formState.errors.name}
          {...form.register('name')}
          className="min-h-12"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Price Score Slider */}
      <div className="space-y-2">
        <Label htmlFor="price_score">Price Score: {priceScore}</Label>
        <Slider
          id="price_score"
          data-testid="competitor-price-input"
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
          className="min-h-12"
        />
        {form.formState.errors.price_score && (
          <p className="text-sm text-destructive">{form.formState.errors.price_score.message}</p>
        )}
      </div>

      {/* Quality Score Slider */}
      <div className="space-y-2">
        <Label htmlFor="quality_score">Quality Score: {qualityScore}</Label>
        <Slider
          id="quality_score"
          data-testid="competitor-quality-input"
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
          className="min-h-12"
        />
        {form.formState.errors.quality_score && (
          <p className="text-sm text-destructive">{form.formState.errors.quality_score.message}</p>
        )}
      </div>

      {/* Category Select */}
      <div className="space-y-2">
        <Label htmlFor="category">Category (optional)</Label>
        <Select
          value={form.watch('category') ?? undefined}
          onValueChange={(value) => form.setValue('category', value as CompetitorFormData['category'], { shouldValidate: true })}
        >
          <SelectTrigger
            id="category"
            data-testid="competitor-category-select"
            className="min-h-12"
          >
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {COMPETITOR_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.category && (
          <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
        )}
      </div>

      {/* Notes Textarea */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          data-testid="competitor-notes-input"
          placeholder="Additional notes..."
          {...form.register('notes')}
          className="min-h-12"
          rows={3}
        />
        {form.formState.errors.notes && (
          <p className="text-sm text-destructive">{form.formState.errors.notes.message}</p>
        )}
      </div>

      {/* Is Kel Position Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_kel_position"
          data-testid="competitor-kel-position-checkbox"
          checked={form.watch('is_kel_position')}
          onCheckedChange={(checked: boolean) => form.setValue('is_kel_position', checked, { shouldValidate: true })}
          className="min-h-6 min-w-6"
        />
        <Label htmlFor="is_kel_position" className="cursor-pointer">
          Mark as Kel&apos;s Target Position
        </Label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="min-h-12 min-w-[100px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!form.formState.isValid || isPending}
          className="min-h-12 min-w-[120px]"
          data-testid="competitor-submit"
        >
          {isPending ? 'Saving...' : mode === 'create' ? 'Add Competitor' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
