# WebSocket Messaging Implementation Guide

## Overview
The messaging feature now supports real-time communication using WebSockets (Socket.io). Messages are sent via REST API and delivered in real-time via WebSocket connections.

## Architecture

### Backend
- **Socket Infrastructure**: `/backend/src/infrastructure/socket.ts`
  - Handles WebSocket authentication
  - Manages user rooms for targeted message delivery
  - Supports typing indicators and message read receipts

- **Message Service**: `/backend/src/services/messageService.ts`
  - Sends messages via REST API with database persistence
  - Emits WebSocket events to recipients for real-time delivery
  - Broadcasts status updates (read, delivered) via WebSocket

### Frontend
- **Socket Service**: `/frontend/src/services/socketService.ts`
  - Manages WebSocket connection lifecycle
  - Provides methods to subscribe/unsubscribe to message events
  - Handles typing indicators and read receipts

- **Message Service**: `/frontend/src/services/messageService.ts`
  - REST API calls for sending messages and fetching history
  - Pagination support for message history

## WebSocket Events

### Backend → Frontend

#### `message:new`
Emitted when a new message is sent.
```typescript
{
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  sentAt: string;
  status: MessageStatus;
}
```

#### `message:status`
Emitted when message status changes (read, delivered).
```typescript
{
  messageId: number;
  status: string;
}
```

#### `typing:start`
Emitted when a user starts typing.
```typescript
{
  senderId: number;
}
```

#### `typing:stop`
Emitted when a user stops typing.
```typescript
{
  senderId: number;
}
```

#### `message:read`
Emitted when a message is read.
```typescript
{
  messageId: number;
  readerId: number;
}
```

### Frontend → Backend

#### `typing:start`
Client emits when user starts typing.
```typescript
socket.emit('typing:start', { receiverId: number });
```

#### `typing:stop`
Client emits when user stops typing.
```typescript
socket.emit('typing:stop', { receiverId: number });
```

#### `message:read`
Client emits when message is read.
```typescript
socket.emit('message:read', { messageId: number, senderId: number });
```

## Usage Example

### Basic Chat Component (React)

```typescript
import { useEffect, useState } from 'react';
import messageService from '../services/messageService';
import socketService from '../services/socketService';
import type { Messages } from '../types';

function ChatComponent({ friendId, currentUserId }: { friendId: number; currentUserId: number }) {
  const [messages, setMessages] = useState<Messages[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    // Connect to WebSocket
    socketService.connect();

    // Load message history
    loadMessages();

    // Subscribe to new messages
    const handleNewMessage = (message: Messages) => {
      if (
        (message.senderId === friendId && message.receiverId === currentUserId) ||
        (message.senderId === currentUserId && message.receiverId === friendId)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    };

    // Subscribe to typing indicators
    const handleTypingStart = ({ senderId }: { senderId: number }) => {
      if (senderId === friendId) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = ({ senderId }: { senderId: number }) => {
      if (senderId === friendId) {
        setIsTyping(false);
      }
    };

    // Subscribe to message status updates
    const handleMessageStatus = ({ messageId, status }: { messageId: number; status: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, status: status as any } : msg
        )
      );
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onTypingStart(handleTypingStart);
    socketService.onTypingStop(handleTypingStop);
    socketService.onMessageStatus(handleMessageStatus);

    // Cleanup
    return () => {
      socketService.offNewMessage(handleNewMessage);
      socketService.offTypingStart(handleTypingStart);
      socketService.offTypingStop(handleTypingStop);
      socketService.offMessageStatus(handleMessageStatus);
    };
  }, [friendId, currentUserId]);

  const loadMessages = async () => {
    try {
      const response = await messageService.getConversation(friendId);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    try {
      await messageService.sendMessage(currentUserId, friendId, inputValue);
      setInputValue('');
      socketService.emitTypingStop(friendId);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // Emit typing indicators
    if (e.target.value.length === 1) {
      socketService.emitTypingStart(friendId);
    } else if (e.target.value.length === 0) {
      socketService.emitTypingStop(friendId);
    }
  };

  const markAsRead = async (message: Messages) => {
    if (message.receiverId === currentUserId && message.status !== 'READ') {
      try {
        await messageService.updateStatus(message.id, 'READ');
        socketService.emitMessageRead(message.id, message.senderId);
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.senderId === currentUserId ? 'sent' : 'received'}
            onClick={() => markAsRead(msg)}
          >
            <p>{msg.content}</p>
            <span className="status">{msg.status}</span>
          </div>
        ))}
        {isTyping && <div className="typing-indicator">Friend is typing...</div>}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatComponent;
```

## Features

### 1. Real-time Message Delivery
Messages are delivered instantly to recipients via WebSocket without polling or page refresh.

### 2. Typing Indicators
Users can see when their friends are typing in real-time.

### 3. Read Receipts
Senders are notified when their messages are read.

### 4. Message Status Updates
Status changes (SENT → DELIVERED → READ) are broadcast in real-time.

### 5. Connection Management
- Automatic reconnection on network issues
- Token-based authentication
- Graceful degradation to polling if WebSocket fails

## REST API Endpoints (Still Available)

The following REST endpoints remain available for fetching message history and pagination:

- `GET /api/messages` - Get all messages (inbox)
- `GET /api/messages/:friendId` - Get conversation with friend
- `POST /api/messages/:friendId` - Send message
- `PATCH /api/messages/:messageId/status` - Update message status
- `DELETE /api/messages/:messageId` - Delete message
- `GET /api/messages/unread` - Get unread messages
- `GET /api/messages/unread/count` - Get unread count
- `GET /api/messages/cursor` - Cursor-based pagination
- `GET /api/messages/:friendId/cursor` - Conversation with cursor pagination

## Security

- WebSocket connections require authentication via JWT tokens
- Each user joins their own private room (`user:{userId}`)
- Messages are only delivered to the intended recipient
- Token scope is limited to "socket" audience
- Token expiration and blacklist checking

## Performance Considerations

1. **Pagination**: Use cursor-based pagination for chat interfaces (better for infinite scroll)
2. **History Loading**: Load message history via REST API on component mount
3. **Real-time Updates**: Use WebSocket only for new messages and status updates
4. **Connection Pooling**: Single WebSocket connection per client, reused across components

## Testing

### Manual Testing
1. Open two browser windows/tabs with different users
2. Send a message from one user
3. Verify real-time delivery in the other window
4. Test typing indicators
5. Test read receipts

### Automated Testing
See existing test files:
- `/backend/src/tests/messageService.test.ts`
- `/backend/src/tests/messageController.test.ts`

## Troubleshooting

### Connection Issues
- Check JWT_SECRET is configured
- Verify FRONTEND_URL in environment variables
- Ensure port 3000 is accessible for WebSocket connections

### Messages Not Delivered
- Check user is connected to WebSocket
- Verify user rooms are correctly joined
- Check server logs for socket events

### Authentication Failures
- Ensure socket token endpoint (`/auth/socket-token`) is working
- Verify token hasn't expired
- Check token isn't blacklisted
