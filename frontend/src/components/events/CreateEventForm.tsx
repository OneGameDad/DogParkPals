import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateEvent, useAuth } from '../../hooks';
import { InputText, Button } from '../common';
import ParkSelector from './ParkSelector';

interface CreateEventFormProps {
    organizationId?: number;
    parkId?: number;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({
    organizationId,
    parkId: initialParkId,
    onSuccess,
    onCancel
}) => {
    const { t } = useTranslation();
    const { createEvent, loading, error } = useCreateEvent();
    const { user } = useAuth();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedParkId, setSelectedParkId] = useState<number | undefined>(initialParkId);
    const [isPrivate, setIsPrivate] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedParkId) {
            alert(t('events.parkRequired', 'Please select a park for this event.'));
            return;
        }

        try {
            // Combine date and time for backend
            const startDateTime = new Date(`${date}T${startTime}`);
            const endDateTime = new Date(`${date}T${endTime}`);

            if (endDateTime <= startDateTime) {
                alert(t('events.timeError', 'End time must be after start time.'));
                return;
            }

            await createEvent({
                title,
                description,
                date: new Date(date).toISOString(),
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                parkId: selectedParkId,
                organizationId,
                organizerId: user?.id,
                private: isPrivate ? 'PRIVATE' : 'PUBLIC',
            });

            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Failed to create event', err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
                    {error}
                </div>
            )}

            <InputText
                id="title"
                label={t('events.title', 'Event Title *')}
                value={title}
                onChange={setTitle}
                required
            />

            <div className="flex flex-col gap-1">
                <label htmlFor="description" className="text-sm font-medium text-gray-700">
                    {t('events.description', 'Description')}
                </label>
                <textarea
                    id="description"
                    rows={3}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputText
                    id="date"
                    type="date"
                    label={t('events.date', 'Date *')}
                    value={date}
                    onChange={setDate}
                    required
                />
                <InputText
                    id="startTime"
                    type="time"
                    label={t('events.startTime', 'Start Time *')}
                    value={startTime}
                    onChange={setStartTime}
                    required
                />
                <InputText
                    id="endTime"
                    type="time"
                    label={t('events.endTime', 'End Time *')}
                    value={endTime}
                    onChange={setEndTime}
                    required
                />
            </div>

            {!initialParkId && (
                <ParkSelector
                    onSelect={(id) => setSelectedParkId(id)}
                    selectedParkId={selectedParkId}
                />
            )}

            <div className="flex items-center gap-2 mt-4">
                <input
                    type="checkbox"
                    id="isPrivate"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPrivate" className="text-sm text-gray-700">
                    {t('events.isPrivate', 'Private Event')}
                </label>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                {onCancel && (
                    <Button
                        type="button"
                        text={t('common.cancel', 'Cancel')}
                        variant="secondary"
                        onClick={onCancel}
                        disabled={loading}
                    />
                )}
                <Button
                    type="submit"
                    text={t('events.createButton', 'Create Event')}
                    loading={loading}
                />
            </div>
        </form>
    );
};

export default CreateEventForm;
