import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../hooks/useFetch';
import { useSubmit } from '../hooks/useSubmit';
import { api } from '../services/api';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import Picture from '../components/common/Picture';
import InputText from '../components/common/InputText';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { type Dog, DogBreed, DogSize, DogGender, DogPlaystyle } from '../types';

const EditDogProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: dog, loading: dogLoading, error: dogError } = useFetch<Dog>(
    id ? `/api/dogs/${id}` : ''
  );

  const [formData, setFormData] = useState({
    name: '',
    breed: '' as DogBreed | '',
    gender: '' as DogGender | '',
    size: '' as DogSize | '',
    playstyle: '' as DogPlaystyle | '',
    description: '',
    profilePictureUrl: '',
    dateOfBirth: '',
    fixed: false,
  });

  useEffect(() => {
    if (dog) {
      setFormData({
        name: dog.name,
        breed: dog.breed,
        gender: dog.gender,
        size: dog.size,
        playstyle: dog.playstyle,
        description: dog.description || '',
        profilePictureUrl: dog.profilePictureUrl || '',
        dateOfBirth: dog.dateOfBirth ? new Date(dog.dateOfBirth).toISOString().split('T')[0] : '',
        fixed: dog.fixed,
      });
    }
  }, [dog]);

  const isEditMode = !!id;

  const { submit, isSubmitting } = useSubmit({
    onSuccess: (data) => {
      const targetId = id || (data as Dog)?.id;
      if (targetId) {
        navigate(`/dog/${targetId}`);
      } else {
        navigate('/profile');
      }
    },
    successMessage: isEditMode ? t('dogProfile.dogUpdated') : t('dogProfile.createdSuccessfully'),
    loadingMessage: isEditMode ? t('dogProfile.updatingDog') : t('dogProfile.creating'),
    errorMessage: isEditMode ? t('dogProfile.failedToUpdate') : t('dogProfile.failedToCreate'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await submit(async () => {
      const payload = {
        name: formData.name,
        breed: formData.breed,
        gender: formData.gender,
        size: formData.size,
        playstyle: formData.playstyle,
        description: formData.description,
        profilePictureUrl: formData.profilePictureUrl,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        fixed: formData.fixed,
        vaccinationRecordUrl: undefined,
      };

      if (isEditMode) {
        return await api.put(`/api/dogs/${id}`, payload);
      } else {
        return await api.post('/api/dogs', payload);
      }
    });
  };

  if (isEditMode && dogLoading) return <Loading message={t('dogProfile.loading')} />;
  if (isEditMode && (dogError || !dog)) return <ErrorMessage message={t('dogProfile.failedToLoad')} showBackButton backTo="/profile" />;

  const selectClassName = "bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full";
  const title = isEditMode ? t('dogProfile.editTitle') : t('dogProfile.addTitle');

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <Header text={title} level="h1" />
          <Button
            text={t('dogProfile.cancel')}
            onClick={() => navigate(isEditMode ? `/dog/${id}` : '/profile')}
            className="bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-800"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="border-4 border-gray-200 rounded-full">
              <Picture
                location={formData.profilePictureUrl || (dog?.profilePictureUrl) || '/imgs/exampledogpic.jpg'}
                size={128}
                shape="circle"
                alt="Dog Preview"
              />
            </div>
          </div>

          {/* Won't be required in final push, just messes up the API call if not there */}
          <InputText
            label={t('dogProfile.profilePictureUrl')}
            value={formData.profilePictureUrl}
            onChange={(val) => setFormData(prev => ({ ...prev, profilePictureUrl: val }))}
            placeholder="https://..."
            required
          />

          <InputText
            label={t('dogProfile.name')}
            value={formData.name}
            onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
            required
          />

          <label className="flex flex-col gap-2 cursor-pointer">
            <span className="font-semibold text-sm">
              {t('dogProfile.breed')}
              <span className="text-red-500 ml-1">*</span>
            </span>
            <select
              value={formData.breed}
              onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value as DogBreed }))}
              className={selectClassName}
              required
            >
              <option value="">{t('dogProfile.selectOption')}</option>
              {Object.keys(DogBreed).filter(k => isNaN(Number(k))).map((breed) => (
                <option key={breed} value={breed}>{breed.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 cursor-pointer">
            <span className="font-semibold text-sm">
              {t('dogProfile.gender')}
              <span className="text-red-500 ml-1">*</span>
            </span>
            <select
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as DogGender }))}
              className={selectClassName}
              required
            >
              <option value="">{t('dogProfile.selectOption')}</option>
              {Object.keys(DogGender).filter(k => isNaN(Number(k))).map((gender) => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 cursor-pointer">
            <span className="font-semibold text-sm">
              {t('dogProfile.size')}
              <span className="text-red-500 ml-1">*</span>
            </span>
            <select
              value={formData.size}
              onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value as DogSize }))}
              className={selectClassName}
              required
            >
              <option value="">{t('dogProfile.selectOption')}</option>
              {Object.keys(DogSize).filter(k => isNaN(Number(k))).map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 cursor-pointer">
            <span className="font-semibold text-sm">
              {t('dogProfile.playstyle')}
              <span className="text-red-500 ml-1">*</span>
            </span>
            <select
              value={formData.playstyle}
              onChange={(e) => setFormData(prev => ({ ...prev, playstyle: e.target.value as DogPlaystyle }))}
              className={selectClassName}
              required
            >
              <option value="">{t('dogProfile.selectOption')}</option>
              {Object.keys(DogPlaystyle).filter(k => isNaN(Number(k))).map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </label>

          <InputText
            label={t('dogProfile.birthdate')}
            type="date"
            value={formData.dateOfBirth}
            onChange={(val) => setFormData(prev => ({ ...prev, dateOfBirth: val }))}
            required
          />

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.fixed}
                onChange={(e) => setFormData(prev => ({ ...prev, fixed: e.target.checked }))}
                className="w-4 h-4"
              />
              {t('dogProfile.fixed')}
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm">{t('dogProfile.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`${selectClassName} h-32`}
              placeholder={t('dogProfile.descriptionPlaceholder')}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              text={isSubmitting ? (isEditMode ? t('dogProfile.saving') : t('dogProfile.creating')) : (isEditMode ? t('dogProfile.saveChanges') : t('dogProfile.createDog'))}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 py-3"
            />
            <Button
              type="button"
              text={t('dogProfile.cancel')}
              onClick={() => navigate(isEditMode ? `/dog/${id}` : '/profile')}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDogProfile;

