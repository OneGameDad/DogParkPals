import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import uploadService from '../../services/uploadService';
import * as fileValidation from '../../utils/fileValidation';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock fileValidation
vi.mock('../../utils/fileValidation', () => ({
  validateFile: vi.fn(),
}));

describe('uploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful validation by default
    (fileValidation.validateFile as any).mockReturnValue({ valid: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteUserProfilePicture', () => {
    it('should send DELETE request with credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await uploadService.deleteUserProfilePicture();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/profile-picture'),
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
        })
      );
    });

    it('should throw error on failed delete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to delete' }),
      });

      await expect(uploadService.deleteUserProfilePicture()).rejects.toThrow(
        'Failed to delete'
      );
    });
  });

  describe('deleteDogPhoto', () => {
    it('should send DELETE request with credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await uploadService.deleteDogPhoto(123);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dogs/123/photo'),
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
        })
      );
    });

    it('should throw error on failed delete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Photo not found' }),
      });

      await expect(uploadService.deleteDogPhoto(123)).rejects.toThrow('Photo not found');
    });
  });

  describe('deleteVaccinationRecord', () => {
    it('should send DELETE request with credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await uploadService.deleteVaccinationRecord(456);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dogs/456/vaccination-record'),
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
        })
      );
    });

    it('should throw error on failed delete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Record not found' }),
      });

      await expect(uploadService.deleteVaccinationRecord(456)).rejects.toThrow(
        'Record not found'
      );
    });
  });
});
});
