import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DogProfileModal from '../../../components/users/DogProfileModal';
import { useAuth } from '../../../hooks/useAuth';
import { useFetch } from '../../../hooks/useFetch';
import { useFriendActions } from '../../../hooks/users/useFriendActions';
import { useDogFriends } from '../../../hooks/users/useDogFriends';
import type { Dog } from '../../../types';
import { DogBreed, DogGender, DogSize, DogPlaystyle } from '../../../types';

// Mock hooks
vi.mock('../../../hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../../hooks/useFetch', () => ({
    useFetch: vi.fn(),
}));

vi.mock('../../../hooks/users/useFriendActions', () => ({
    useFriendActions: vi.fn(),
}));

vi.mock('../../../hooks/users/useDogFriends', () => ({
    useDogFriends: vi.fn(),
}));

// ... (existing mocks)

describe('DogProfileModal Component', () => {
    const mockDog: Dog = {
        id: 1,
        name: 'Buddy',
        breed: DogBreed.GERMAN_SHEPHERD_DOG,
        gender: DogGender.MALE,
        size: DogSize.LARGE,
        playstyle: DogPlaystyle.ENERGETIC,
        dateOfBirth: '2020-01-01',
        fixed: true,
        description: 'A good boy',
        profilePictureUrl: 'url',
        vaccinationRecordUrl: null,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
    };

    const mockUser = { id: 101, username: 'user1' };
    const mockMyDogs = [{ id: 101, name: 'MyDog' }];

    const mockAddFriend = vi.fn();
    const mockRemoveFriend = vi.fn();
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        (useAuth as any).mockReturnValue({ user: mockUser });
        (useFetch as any).mockReturnValue({ data: mockMyDogs }); // My dogs
        (useFriendActions as any).mockReturnValue({
            addFriend: mockAddFriend,
            actionLoading: false,
        });
        (useDogFriends as any).mockReturnValue({
            friends: [],
            loading: false,
            removeFriend: mockRemoveFriend,
            refetch: vi.fn(),
        });
    });

    it('should render dog details', () => {
        render(<DogProfileModal dog={mockDog} onClose={mockOnClose} />);

        const names = screen.getAllByText('Buddy');
        expect(names.length).toBeGreaterThan(0);
        expect(names[0]).toBeInTheDocument();
        expect(screen.getByText('GERMAN SHEPHERD DOG • Age unknown')).toBeInTheDocument();
        expect(screen.getByText('dogProfile.gender:')).toBeInTheDocument();
        expect(screen.getByText('MALE')).toBeInTheDocument();
    });

    it('should show "Add Friend" section if user is not owner and has dogs', () => {
        render(<DogProfileModal dog={mockDog} onClose={mockOnClose} />);
        expect(screen.getByText('Add as Friend')).toBeInTheDocument();
    });

    it('should NOT show "Add Friend" section if user IS owner', () => {
        (useFetch as any).mockReturnValue({ data: [mockDog] }); // User owns this dog
        render(<DogProfileModal dog={mockDog} onClose={mockOnClose} />);
        expect(screen.queryByText('Add as Friend')).not.toBeInTheDocument();
    });

    it('should NOT show "Add Friend" section if user has NO dogs', () => {
        (useFetch as any).mockReturnValue({ data: [] });
        render(<DogProfileModal dog={mockDog} onClose={mockOnClose} />);
        expect(screen.queryByText('Add as Friend')).not.toBeInTheDocument();
    });

    it('should call addFriend when button is clicked', async () => {
        mockAddFriend.mockResolvedValue(true);
        render(<DogProfileModal dog={mockDog} onClose={mockOnClose} />);

        const addButton = screen.getByText('findFriends.addFriend');
        fireEvent.click(addButton);

        expect(mockAddFriend).toHaveBeenCalledWith(mockDog.id, true, 101);
        await waitFor(() => expect(mockOnClose).toHaveBeenCalled());
    });

    it('should handle multiple dogs selection for adding friend', async () => {
        const myDogs = [
            { id: 101, name: 'Dog A' },
            { id: 102, name: 'Dog B' },
        ];
        (useFetch as any).mockReturnValue({ data: myDogs });

        render(<DogProfileModal dog={mockDog} onClose={mockOnClose} />);

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '102' } });

        const addButton = screen.getByText('findFriends.addFriend');
        fireEvent.click(addButton);

        expect(mockAddFriend).toHaveBeenCalledWith(mockDog.id, true, 102);
    });

    it('should show Unfriend button if already friends', () => {
        (useDogFriends as any).mockReturnValue({
            friends: [mockDog], // Already friends with this dog
            loading: false,
            removeFriend: mockRemoveFriend,
            refetch: vi.fn(),
        });

        render(<DogProfileModal dog={mockDog} onClose={mockOnClose} />);

        const button = screen.getByText('friends.unfriend');
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
    });

    it('should call removeFriend when Unfriend button is clicked', async () => {
        (useDogFriends as any).mockReturnValue({
            friends: [mockDog],
            loading: false,
            removeFriend: mockRemoveFriend,
            refetch: vi.fn(),
        });

        vi.spyOn(window, 'confirm').mockReturnValue(true);
        mockRemoveFriend.mockResolvedValue(true);

        render(<DogProfileModal dog={mockDog} onClose={mockOnClose} />);

        const button = screen.getByText('friends.unfriend');
        fireEvent.click(button);

        expect(mockRemoveFriend).toHaveBeenCalledWith(mockDog.id);
    });
});
