/**
 * Tests for AI Pitch Summary Generation API Route
 *
 * Story 18-3: Export with AI Summary
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

import type {
  GeneratePitchSummaryRequest,
  GeneratePitchSummaryResponse,
  GeneratePitchSummaryErrorResponse,
} from './route';

// Mock environment
vi.mock('@/lib/env', () => ({
  env: {
    ANTHROPIC_API_KEY: 'test-api-key',
    isDevelopment: false,
  },
}));

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock AI SDK
const mockGenerateObject = vi.fn();
vi.mock('ai', () => ({
  generateObject: (args: unknown) => mockGenerateObject(args),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => vi.fn(() => 'mock-model')),
}));

// Import POST after mocks are set up
import { POST } from './route';

describe('POST /api/ai/generate-pitch-summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create request
  const createRequest = (body: Partial<GeneratePitchSummaryRequest> | string) => {
    return new Request('http://localhost/api/ai/generate-pitch-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  };

  // Helper to setup successful auth
  const setupAuth = (authenticated = true) => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: authenticated ? { id: 'user-123' } : null },
      error: authenticated ? null : new Error('Not authenticated'),
    });
  };

  // Helper to setup pitch draft query
  const setupPitchDraft = (exists = true) => {
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: exists ? { id: 'draft-123', title: 'Test Pitch', status: 'draft' } : null,
        error: exists ? null : new Error('Not found'),
      }),
    };
    return selectChain;
  };

  // Helper to setup sections query
  const setupSections = (
    sections: Array<{ section_type: string; content: string }> | null
  ) => {
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: sections,
        error: sections === null ? new Error('Query failed') : null,
      }),
    };
    return selectChain;
  };

  it('returns 400 for empty request body', async () => {
    const request = new Request('http://localhost/api/ai/generate-pitch-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '',
    });

    const response = await POST(request);
    const data = (await response.json()) as GeneratePitchSummaryErrorResponse;

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for missing pitch_draft_id', async () => {
    const request = createRequest({});

    const response = await POST(request);
    const data = (await response.json()) as GeneratePitchSummaryErrorResponse;

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('pitch_draft_id');
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 for unauthenticated requests', async () => {
    setupAuth(false);

    const request = createRequest({ pitch_draft_id: 'draft-123' });
    const response = await POST(request);
    const data = (await response.json()) as GeneratePitchSummaryErrorResponse;

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication');
  });

  it('returns 404 when pitch draft not found', async () => {
    setupAuth(true);
    const draftChain = setupPitchDraft(false);
    mockSupabase.from.mockReturnValue({ select: vi.fn().mockReturnValue(draftChain) });

    const request = createRequest({ pitch_draft_id: 'nonexistent' });
    const response = await POST(request);
    const data = (await response.json()) as GeneratePitchSummaryErrorResponse;

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('not found');
  });

  it('returns 400 when pitch has no sections', async () => {
    setupAuth(true);
    const draftChain = setupPitchDraft(true);
    const sectionsChain = setupSections([]);

    // First call for pitch_drafts, second for pitch_sections
    let callCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'pitch_drafts') {
        return { select: vi.fn().mockReturnValue(draftChain) };
      }
      return { select: vi.fn().mockReturnValue(sectionsChain) };
    });

    const request = createRequest({ pitch_draft_id: 'draft-123' });
    const response = await POST(request);
    const data = (await response.json()) as GeneratePitchSummaryErrorResponse;

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe('EMPTY_PITCH');
  });

  it('returns 400 when pitch only has dynamic sections (no text content)', async () => {
    setupAuth(true);
    const draftChain = setupPitchDraft(true);
    // Only competitive_landscape and market_gaps (dynamic sections)
    const sectionsChain = setupSections([
      { section_type: 'competitive_landscape', content: '{}' },
      { section_type: 'market_gaps', content: '{}' },
    ]);

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'pitch_drafts') {
        return { select: vi.fn().mockReturnValue(draftChain) };
      }
      return { select: vi.fn().mockReturnValue(sectionsChain) };
    });

    const request = createRequest({ pitch_draft_id: 'draft-123' });
    const response = await POST(request);
    const data = (await response.json()) as GeneratePitchSummaryErrorResponse;

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe('EMPTY_PITCH');
    expect(data.error).toContain('text section');
  });

  it('generates summary successfully with valid sections', async () => {
    setupAuth(true);
    const draftChain = setupPitchDraft(true);
    const sectionsChain = setupSections([
      { section_type: 'market_opportunity', content: 'Growing snack market in Philippines' },
      { section_type: 'competitive_positioning', content: 'Unique puffed corn product' },
    ]);

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'pitch_drafts') {
        return { select: vi.fn().mockReturnValue(draftChain) };
      }
      return { select: vi.fn().mockReturnValue(sectionsChain) };
    });

    mockGenerateObject.mockResolvedValue({
      object: {
        summary:
          'Philippine snack market offers 15% growth. Kel puffed corn fills unmet demand.',
      },
    });

    const request = createRequest({ pitch_draft_id: 'draft-123' });
    const response = await POST(request);
    const data = (await response.json()) as GeneratePitchSummaryResponse;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.summary).toContain('Philippine');
    expect(data.metadata.model).toBe('claude-sonnet-4-20250514');
    expect(data.metadata.sections_analyzed).toBe(2);
    expect(data.generated_at).toBeDefined();
  });

  it('includes all text sections in prompt', async () => {
    setupAuth(true);
    const draftChain = setupPitchDraft(true);
    const sectionsChain = setupSections([
      { section_type: 'market_opportunity', content: 'Market content' },
      { section_type: 'competitive_positioning', content: 'Competitive content' },
      { section_type: 'trend_alignment', content: 'Trend content' },
    ]);

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'pitch_drafts') {
        return { select: vi.fn().mockReturnValue(draftChain) };
      }
      return { select: vi.fn().mockReturnValue(sectionsChain) };
    });

    mockGenerateObject.mockResolvedValue({
      object: { summary: 'Test summary for validation.' },
    });

    const request = createRequest({ pitch_draft_id: 'draft-123' });
    await POST(request);

    // Verify generateObject was called with prompt containing all sections
    expect(mockGenerateObject).toHaveBeenCalledTimes(1);
    const callArg = mockGenerateObject.mock.calls[0][0] as { prompt: string };
    expect(callArg.prompt).toContain('Market Opportunity');
    expect(callArg.prompt).toContain('Competitive Positioning');
    expect(callArg.prompt).toContain('Trend Alignment');
    expect(callArg.prompt).toContain('Market content');
    expect(callArg.prompt).toContain('Competitive content');
    expect(callArg.prompt).toContain('Trend content');
  });

  it('returns 504 on timeout', async () => {
    setupAuth(true);
    const draftChain = setupPitchDraft(true);
    const sectionsChain = setupSections([
      { section_type: 'market_opportunity', content: 'Test content' },
    ]);

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'pitch_drafts') {
        return { select: vi.fn().mockReturnValue(draftChain) };
      }
      return { select: vi.fn().mockReturnValue(sectionsChain) };
    });

    const timeoutError = new Error('Timeout');
    timeoutError.name = 'TimeoutError';
    mockGenerateObject.mockRejectedValue(timeoutError);

    const request = createRequest({ pitch_draft_id: 'draft-123' });
    const response = await POST(request);
    const data = (await response.json()) as GeneratePitchSummaryErrorResponse;

    expect(response.status).toBe(504);
    expect(data.success).toBe(false);
    expect(data.code).toBe('TIMEOUT');
  });

  it('returns 429 on rate limit', async () => {
    setupAuth(true);
    const draftChain = setupPitchDraft(true);
    const sectionsChain = setupSections([
      { section_type: 'market_opportunity', content: 'Test content' },
    ]);

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'pitch_drafts') {
        return { select: vi.fn().mockReturnValue(draftChain) };
      }
      return { select: vi.fn().mockReturnValue(sectionsChain) };
    });

    mockGenerateObject.mockRejectedValue(new Error('rate limit exceeded'));

    const request = createRequest({ pitch_draft_id: 'draft-123' });
    const response = await POST(request);
    const data = (await response.json()) as GeneratePitchSummaryErrorResponse;

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.code).toBe('RATE_LIMIT');
  });
});
