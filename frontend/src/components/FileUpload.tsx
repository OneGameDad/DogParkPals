import { useState } from 'react';
import uploadService from '../services/uploadService';
import { validateFile } from '../utils/fileValidation';
import type { UploadCategory } from '../constants';
import Button from './Button'; // TODO: Or wherever is located

interface FileUploadProps {
  category: UploadCategory;
  onUpload: (url: string) => void;
  onError?: (error: string) => void;
  initialPreview?: string;
  accept?: string;
  label?: string;
  itemId?: number;
}

const FileUpload = ({
  category,
  onUpload,
  onError,
  initialPreview,
  accept = 'image/*,.pdf',
  label = 'Upload File',
  itemId,
}: FileUploadProps) => {
  const [preview, setPreview] = useState<string | null>(initialPreview || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, category);
    if (!validation.valid) {
      setError(validation.error || 'File validation failed');
      onError?.(validation.error || 'File validation failed');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      let response;
      if (category === 'userProfile') {
        response = await uploadService.uploadUserProfilePicture(selectedFile, (percent) => setProgress(percent));
      } else if (category === 'dogPhoto') {
        if (!itemId) throw new Error('Dog ID is required for dog photo upload');
        response = await uploadService.uploadDogPhoto(itemId, selectedFile, (percent) => setProgress(percent));
      } else if (category === 'document') {
        if (!itemId) throw new Error('Dog ID is required for vaccination record upload');
        response = await uploadService.uploadVaccinationRecord(itemId, selectedFile, (percent) => setProgress(percent));
      } else {
        response = await uploadService.uploadFile(selectedFile, category, '/api/upload');
      }

      onUpload(response.url);
      setSelectedFile(null);
      if (selectedFile && selectedFile.type.startsWith('image/')) setPreview(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    setLoading(true);
    setError(null);

    try {
      if (category === 'userProfile') {
        await uploadService.deleteUserProfilePicture();
      } else if (category === 'dogPhoto') {
        if (!itemId) throw new Error('Dog ID required for deletion');
        await uploadService.deleteDogPhoto(itemId);
      } else if (category === 'document') {
        if (!itemId) throw new Error('Dog ID required for deletion');
        await uploadService.deleteVaccinationRecord(itemId);
      }

      setPreview(null);
      setSelectedFile(null);
      onUpload('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">{label}</label>
        <input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={loading}
          className="block w-full text-sm"
        />
      </div>

      {preview && (
        <div className="mt-2">
          <img src={preview} alt="Preview" className="max-w-xs max-h-48 rounded" />
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {progress !== null && (
        <div className="w-full bg-gray-200 rounded mt-2">
          <div
            className="bg-blue-500 text-xs text-white text-center rounded"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {selectedFile && (
          <Button onClick={handleUpload} disabled={loading} variant="primary">
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        )}
        {(preview || selectedFile === null) && !loading && (
          <Button onClick={handleDelete} variant="danger">
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};

export default FileUpload;