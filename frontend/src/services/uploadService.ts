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
    endpoint: string,
    onProgress?: (percent: number) => void
  ): Promise<UploadResponse> {
    const validation = validateFile(file, category);
    if (!validation.valid) {
      throw new Error(validation.error || 'File validation failed');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}${endpoint}`, true);
      xhr.withCredentials = true;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            // Backend may return { url } or { profilePictureUrl } depending on endpoint
            const resolvedUrl = data.url || data.profilePictureUrl || data.vaccinationRecordUrl || data.photoUrl || data.dogPhotoUrl || data.documentUrl;
            if (!resolvedUrl) reject(new Error('Upload succeeded but no URL returned'));
            else resolve({ url: resolvedUrl } as UploadResponse);
          } catch {
            reject(new Error('Invalid JSON response from server'));
          }
        } else {
          let errorMsg = 'Upload failed';
          try {
            const errorData = JSON.parse(xhr.responseText);
            if (errorData?.message) errorMsg = errorData.message;
          } catch {
            // fallback if response is not JSON
          }
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during file upload'));
      xhr.send(formData);
    });
  },

  async _delete(url: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      let errorMsg = 'Delete failed';
      try {
        const data = await response.json();
        if (data?.message) errorMsg = data.message;
      } catch { }
      throw new Error(errorMsg);
    }
  },

  async deleteUserProfilePicture(): Promise<void> {
    return this._delete('/users/profile-picture');
  },

  async deleteDogPhoto(dogId: number): Promise<void> {
    return this._delete(`/api/dogs/${dogId}/photo`);
  },

  async deleteVaccinationRecord(dogId: number): Promise<void> {
    return this._delete(`/api/dogs/${dogId}/document`);
  },

  async uploadUserProfilePicture(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<UploadResponse> {
    return this.uploadFile(file, 'userProfile', '/users/profile-picture', onProgress);
  },

  async uploadDogPhoto(dogId: number, file: File, onProgress?: (percent: number) => void): Promise<UploadResponse> {
    return this.uploadFile(file, 'dogPhoto', `/api/dogs/${dogId}/photo`, onProgress);
  },

  async uploadVaccinationRecord(dogId: number, file: File, onProgress?: (percent: number) => void): Promise<UploadResponse> {
    return this.uploadFile(file, 'document', `/api/dogs/${dogId}/document`, onProgress);
  },

  async uploadOrganizationProfilePicture(
    orgId: number,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<UploadResponse> {
    return this.uploadFile(file, 'organizationProfile', `/api/organizations/${orgId}/profile-picture`, onProgress);
  },

  async deleteOrganizationProfilePicture(orgId: number): Promise<void> {
    return this._delete(`/api/organizations/${orgId}/profile-picture`);
  },
};

export default uploadService;