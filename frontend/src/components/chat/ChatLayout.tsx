import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import { useAuth } from '../../hooks/useAuth';

const ChatLayout = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // Read ID from URL
    const activeFriendId = searchParams.get('friend')
        ? Number(searchParams.get('friend'))
        : null;

    if (!user) return null;

    const handleSelectFriend = (id: number) => {
        setSearchParams({ friend: id.toString() });
    };

    return (
        <div className="flex flex-1 h-full min-h-0 gap-4">
            {/* Sidebar - Conversation List */}
            <div className={`w-full md:w-1/3 lg:w-1/4 ${activeFriendId ? 'hidden md:block' : 'block'}`}>
                <ConversationList
                    currentUserId={user.id}
                    activeFriendId={activeFriendId}
                    onSelectFriend={handleSelectFriend}
                />
            </div>

            {/* Main Content - Message Thread */}
            <div className={`w-full md:w-2/3 lg:w-3/4 ${!activeFriendId ? 'hidden md:block' : 'block'}`}>
                {activeFriendId ? (
                    <div className="h-full flex flex-col">
                        <button
                            onClick={() => setSearchParams({})}
                            className="md:hidden mb-2 text-blue-600 font-semibold flex items-center"
                        >
                            &larr; {t('common.back') || 'Back'}
                        </button>
                        <MessageThread
                            friendId={activeFriendId}
                            currentUserId={user.id}
                        />
                    </div>
                ) : (
                    <div className="h-full bg-white rounded-lg shadow-md flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <h3 className="text-xl font-medium">{t('chat.selectConversation') || 'Select a conversation'}</h3>
                        <p className="mt-2">{t('chat.startTalking') || 'Choose a friend from the list to start chatting.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatLayout;
