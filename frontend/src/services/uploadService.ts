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

    // Get token for auth
    const token = localStorage.getItem('token');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}${endpoint}`, true);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

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
            if (!data.url) reject(new Error('Upload succeeded but no URL returned'));
            else resolve(data as UploadResponse);
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

  async deleteUserProfilePicture(): Promise<void> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/users/profile-picture`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      let errorMsg = 'Delete failed';
      try {
        const data = await response.json();
        if (data?.message) errorMsg = data.message;
      } catch {}
      throw new Error(errorMsg);
    }
  },

  async deleteDogPhoto(dogId: number): Promise<void> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/dogs/${dogId}/photo`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      let errorMsg = 'Delete failed';
      try {
        const data = await response.json();
        if (data?.message) errorMsg = data.message;
      } catch {}
      throw new Error(errorMsg);
    }
  },

  async deleteVaccinationRecord(dogId: number): Promise<void> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/dogs/${dogId}/vaccination-record`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      let errorMsg = 'Delete failed';
      try {
        const data = await response.json();
        if (data?.message) errorMsg = data.message;
      } catch {}
      throw new Error(errorMsg);
    }
  },

  async uploadUserProfilePicture(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<UploadResponse> {
    return this.uploadFile(file, 'userProfile', '/api/users/profile-picture', onProgress);
  },

  async uploadDogPhoto(dogId: number, file: File, onProgress?: (percent: number) => void): Promise<UploadResponse> {
    return this.uploadFile(file, 'dogPhoto', `/api/dogs/${dogId}/photo`, onProgress);
  },

  async uploadVaccinationRecord(dogId: number, file: File, onProgress?: (percent: number) => void): Promise<UploadResponse> {
    return this.uploadFile(file, 'document', `/api/dogs/${dogId}/vaccination-record`, onProgress);
  },
};

export default uploadService;