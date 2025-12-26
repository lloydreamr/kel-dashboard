// Input types - use null for nullable, not undefined
// Note: CompetitorDataPoint is exported from database.ts (auto-generated)
export interface CreateCompetitorInput {
  name: string;
  price_score: number;
  quality_score: number;
  category?: string | null;
  notes?: string | null;
  is_kel_position?: boolean;
}

export interface UpdateCompetitorInput {
  name?: string;
  price_score?: number;
  quality_score?: number;
  category?: string | null;
  notes?: string | null;
  is_kel_position?: boolean;
}
