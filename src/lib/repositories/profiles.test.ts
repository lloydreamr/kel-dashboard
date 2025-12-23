import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RepositoryErrorCode, isRepositoryError } from './base';
import { profilesRepo } from './profiles';

// Mock data
const mockProfile = {
  id: 'user-123',
  email: 'test@example.com',
  role: 'maho' as const,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

// Mock Supabase client
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

describe('profilesRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default chain setup
    mockSingle.mockResolvedValue({ data: mockProfile, error: null });
    mockSelect.mockReturnValue({ single: mockSingle, eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle, select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    });
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
  });

  describe('getCurrent', () => {
    it('returns profile when found', async () => {
      const profile = await profilesRepo.getCurrent();

      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(profile).toEqual(mockProfile);
    });

    it('returns null when no profile exists', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'no rows' },
      });

      const profile = await profilesRepo.getCurrent();
      expect(profile).toBeNull();
    });

    it('throws RepositoryError on database error', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'access denied' },
      });

      try {
        await profilesRepo.getCurrent();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(isRepositoryError(error)).toBe(true);
        if (isRepositoryError(error)) {
          expect(error.code).toBe(RepositoryErrorCode.UNAUTHORIZED);
        }
      }
    });
  });

  describe('getById', () => {
    it('returns profile when found', async () => {
      const profile = await profilesRepo.getById('user-123');

      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
      expect(profile).toEqual(mockProfile);
    });

    it('throws NOT_FOUND when profile does not exist', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'no rows' },
      });

      try {
        await profilesRepo.getById('non-existent');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(isRepositoryError(error)).toBe(true);
        if (isRepositoryError(error)) {
          expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
        }
      }
    });
  });

  describe('update', () => {
    it('updates profile with provided fields', async () => {
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });

      const profile = await profilesRepo.update({ role: 'kel' });

      expect(mockGetUser).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'kel',
          updated_at: expect.any(String),
        })
      );
      expect(profile).toEqual(mockProfile);
    });

    it('throws UNAUTHORIZED when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'not authenticated' },
      });

      try {
        await profilesRepo.update({ role: 'kel' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(isRepositoryError(error)).toBe(true);
        if (isRepositoryError(error)) {
          expect(error.code).toBe(RepositoryErrorCode.UNAUTHORIZED);
        }
      }
    });

    it('throws VALIDATION on check constraint violation', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: '23514', message: 'check constraint violation' },
      });

      try {
        // @ts-expect-error - testing invalid role
        await profilesRepo.update({ role: 'invalid' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(isRepositoryError(error)).toBe(true);
        if (isRepositoryError(error)) {
          expect(error.code).toBe(RepositoryErrorCode.VALIDATION);
        }
      }
    });
  });
});
