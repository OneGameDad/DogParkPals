import { validateFile } from '../utils/fileValidation';
import type { UploadCategory } from '../constants';
import { API_BASE_URL } from '../constants';

interface UploadResponse {
  url: string;
}

const uploadService = {
  async uploadFile(
    file: File,
    category: UploadCategory,
    endpoint: string
  ): Promise<UploadResponse> {
    // Validate file
    const validation = validateFile(file, category);
    if (!validation.valid) {
      throw new Error(validation.error || 'File validation failed');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Get token for auth
    const token = localStorage.getItem('token');

    // Send to backend
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = 'Upload failed';
      try {
        const errorData = await response.json();
        if (errorData?.message) errorMsg = errorData.message;
      } catch {
        // fallback if response is not JSON
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    if (!data.url) {
      throw new Error('Upload succeeded but no URL returned');
    }

    return data as UploadResponse;
  },

  async uploadUserProfilePicture(file: File): Promise<UploadResponse> {
    return this.uploadFile(file, 'userProfile', '/api/users/profile-picture');
  },

  async uploadDogPhoto(dogId: number, file: File): Promise<UploadResponse> {
    return this.uploadFile(file, 'dogPhoto', `/api/dogs/${dogId}/photo`);
  },

  async uploadVaccinationRecord(dogId: number, file: File): Promise<UploadResponse> {
    return this.uploadFile(file, 'document', `/api/dogs/${dogId}/vaccination-record`);
  },
};

export default uploadService;