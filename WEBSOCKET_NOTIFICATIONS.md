# WebSocket Real-Time Notifications System

## Overview

This document describes the complete WebSocket-based real-time notification system implemented for DogParkPals using Socket.io.

**Note:** The same Socket.io infrastructure is also used for real-time messaging. See [WEBSOCKET_MESSAGING.md](./WEBSOCKET_MESSAGING.md) for messaging-specific implementation details.

## Architecture

### Backend Components

#### 1. Socket.io Server Setup (`backend/src/infrastructure/socket.ts`)
- Initializes Socket.io server with CORS configuration
- Handles WebSocket connections with automatic fallback to polling
- Implements JWT-based authentication middleware
- Manages user rooms for targeted notifications (`user:${userId}`)
- Handles connection/disconnection events

#### 2. Notification Service (`backend/src/services/notificationService.ts`)
- Enhanced with Socket.io integration
- Creates notifications in database AND emits them via WebSocket
- Supports both single and bulk notification creation
- Methods:
  - `createNotification()` - Create and emit a single notification
  - `createNotifications()` - Create and emit multiple notifications
  - `markAsRead()` - Mark notification as read
  - `markAllAsRead()` - Mark all user notifications as read

#### 3. Server Integration (`backend/src/server.ts`)
- Creates HTTP server from Express app
- Attaches Socket.io to HTTP server
- Initializes notification service with Socket.io instance

#### 4. Event Handlers (`backend/src/handlers/notifications/`)
- Existing event handlers automatically emit real-time notifications
- Examples:
  - `onMessageSent.ts` - Notifies when message received
  - `onEventCreated.ts` - Notifies organization members of new events
  - `onAchievementAwarded.ts` - Notifies user of achievement
  - And 15+ other handlers

### Frontend Components

#### 1. Socket Service (`frontend/src/services/socketService.ts`)
- Singleton service managing Socket.io client connection
- Obtains JWT token via `/auth/socket-token` endpoint
- Features:
  - Auto-reconnection with exponential backoff
  - Connection state management
  - Event subscription/unsubscription
  - Graceful disconnect on logout

#### 2. Notification Context (`frontend/src/context/NotificationContext.tsx`)
- React Context providing notification state across app
- Features:
  - Stores notification history
  - Tracks unread count
  - Shows visual notifications using NotifContainer
  - Only connects when user is authenticated
  - Auto-disconnects on logout

#### 3. UI Components
- **NotifContainer** (`frontend/src/components/features/Notif.tsx`)
  - Displays pop-up notifications in top-right
  - Auto-dismisses after 5 seconds
  - Supports i18n with variable interpolation
  
- **NotificationBadge** (`frontend/src/components/features/NotificationBadge.tsx`)
  - Shows unread notification count
  - Can be added to navbar or any component
  - Automatically hides when count is 0

#### 4. useNotifications Hook
- Exported from `frontend/src/hooks/index.ts`
- Provides access to:
  - `notifications` - Array of notification objects
  - `unreadCount` - Number of unread notifications
  - `markAsRead(id)` - Mark specific notification as read
  - `markAllAsRead()` - Mark all as read
  - `clearNotifications()` - Clear all notifications

## Authentication Flow

1. User logs in via `/auth/login` and receives a long-lived `authToken` httpOnly cookie.
2. Frontend requests a dedicated socket token from `/auth/socket-token`.
3. Backend issues a short-lived JWT (90 seconds) with `aud: "socket"` and `tokenType: "socket"`.
4. Socket.io client connects with that socket token in the auth handshake.
5. Backend validates signature, audience, token type, and blacklist state.
6. Backend attaches `userId` to the socket.
7. User joins personal room: `user:${userId}` and receives targeted notifications.

## Notification Types

All notification types from `NotificationType` enum are supported:

- `FRIENDSHIP_REQUEST` / `FRIENDSHIP_ACCEPTED`
- `MESSAGE_RECEIVED`
- `EVENT_INVITATION` / `EVENT_CREATED` / `EVENT_REMINDER` / `EVENT_DELETED`
- `ORGANIZATION_JOIN_REQUEST` / `ORGANIZATION_JOIN_APPROVED` / `ORGANIZATION_ROLE_UPDATED`
- `ACHIEVEMENT_EARNED` / `LEVEL_UP`
- `DOG_OWNERSHIP_ADDED` / `DOG_OWNERSHIP_REMOVED`
- `PARK_CHECKED_IN`
- And 20+ more...

## How to Use

### Backend: Emit a Notification

```typescript
import notificationService from '../services/notificationService';
import { NotificationType } from '@prisma/client';

// Single notification
await notificationService.createNotification(
  userId,
  NotificationType.MESSAGE_RECEIVED,
  {
    messageId: 123,
    senderId: 456,
    name: "John Doe"
  }
);

// Multiple notifications (e.g., notify all org members)
await notificationService.createNotifications(
  [userId1, userId2, userId3],
  NotificationType.EVENT_CREATED,
  {
    eventId: 789,
    name: "Community Walk"
  }
);
```

### Frontend: Access Notifications

```typescript
import { useNotifications } from '../hooks';

function MyComponent() {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map(notif => (
        <div key={notif.id}>
          {notif.type} - {notif.read ? 'Read' : 'Unread'}
          <button onClick={() => markAsRead(notif.id)}>Mark Read</button>
        </div>
      ))}
    </div>
  );
}
```

### Frontend: Add Notification Badge

```typescript
import { NotificationBadge } from '../components/features';

function Navbar() {
  return (
    <nav>
      <Link to="/notifications">
        Notifications <NotificationBadge />
      </Link>
    </nav>
  );
}
```

## Setup & Installation

### Dependencies

**Backend:**
```bash
npm install socket.io @types/socket.io
```

**Frontend:**
```bash
npm install socket.io-client
```

### Environment Variables

No additional environment variables required. Uses existing:
- `JWT_SECRET` - For token verification
- `FRONTEND_URL` - For CORS configuration
- `PORT` - Server port (default: 3000)

### Integration Checklist

✅ Socket.io server initialized in `server.ts`  
✅ Notification service enhanced with Socket.io  
✅ `/auth/socket-token` endpoint issues short-lived scoped tokens  
✅ Socket service created on frontend  
✅ NotificationContext wraps App  
✅ NotifContainer displays notifications  
✅ NotificationBadge component integrated  
✅ Existing event handlers automatically work  
✅ Backend unit tests (33/33 passing)  
✅ Backend integration tests (10/10 passing)  
✅ Frontend service tests (18/18 passing)  
✅ Frontend context tests implemented  
✅ Frontend component tests implemented  

## Authentication Details

### Socket Token Endpoint

**Endpoint:** `GET /auth/socket-token`

**Authentication:** Requires valid app authentication (via httpOnly cookie or Bearer token)

**Request:**
```bash
curl -H "Authorization: Bearer <jwt_token>" http://localhost:3000/auth/socket-token
# or with cookie
curl --cookie "authToken=<jwt_token>" http://localhost:3000/auth/socket-token
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Token Semantics:**
- This endpoint returns a dedicated socket token, not the long-lived app session token.
- Token lifetime is short (`90s`).
- Required claims include `aud: "socket"` and `tokenType: "socket"`.

**Security Note:**
- Keeping the main session JWT in an httpOnly cookie limits direct JavaScript access.
- Socket authentication uses a narrowly scoped token to reduce blast radius if frontend code is compromised.

## Testing

### Test Coverage

The WebSocket notification system is comprehensively tested with **61 passing tests** across backend and frontend:

#### Backend Tests

**Unit Tests - Socket Service** (`backend/src/tests/socketService.test.ts`)
- ✅ 15 tests passing
- JWT authentication validation
- CORS configuration verification
- Socket.io server initialization
- Room management (user:${userId})
- Connection/disconnect event handling
- Reconnection attempt tracking
- Error handling and resilience

**Unit Tests - Notification Service** (`backend/src/tests/notificationService.test.ts`)
- ✅ 18 tests passing
- Single notification creation and emission
- Bulk notification creation
- Mark as read operations
- Mark all as read operations  
- Transaction support
- Socket.io emission verification
- Database persistence validation

**Integration Tests** (`backend/src/tests/integration/socketNotifications.test.ts`)
- ✅ 10 tests passing
- Socket token endpoint authentication and scoped token claims validation
- Notification retrieval with pagination
- Notification filtering (unread only)
- Mark notification as read
- Mark all notifications as read
- Authentication security enforcement
- Cross-user data isolation

#### Frontend Tests

**Service Tests** (`frontend/src/services/__tests__/socketService.test.ts`)
- ✅ 18 tests passing
- Socket token retrieval from backend
- Socket.io client initialization
- Scoped short-lived socket token authentication flow
- Connection state management
- Event subscription/unsubscription
- Reconnection with exponential backoff
- Error handling and recovery
- Graceful disconnect on logout

**Context Tests** (`frontend/src/context/__tests__/NotificationContext.test.tsx`)
- ✅ Tests for provider setup
- useNotifications hook functionality
- Socket connection lifecycle
- Message type conversion for i18n
- Auth state dependency
- Notification event handling

**Component Tests**
- **NotificationBadge** (`frontend/src/components/features/__tests__/NotificationBadge.test.tsx`)
  - ✅ Badge rendering and styling
  - Count display logic
  - 99+ overflow handling
  - Visibility toggle at 0
  
- **NotifContainer** (`frontend/src/components/features/__tests__/NotifContainer.test.tsx`)
  - ✅ Notification display
  - 5-second auto-dismiss
  - Close button functionality
  - i18n variable substitution
  - Multiple notification handling

### Running Tests

**Backend Tests:**
```bash
# All backend tests
cd backend && npm test

# Socket and notification tests only
npm test -- --testPathPattern="socketService|notificationService"

# Integration tests
npm run test:integration -- --testPathPattern="socketNotifications"
```

**Frontend Tests:**
```bash
# All frontend tests
cd frontend && npm test

# Socket service tests
npm test -- src/services/__tests__/socketService.test.ts --run

# Context tests
npm test -- src/context/__tests__/NotificationContext.test.tsx --run

# Component tests
npm test -- src/components/features/__tests__ --run
```

### Manual Testing

1. **Start backend**: `npm run dev` in backend/
2. **Start frontend**: `npm run dev` in frontend/
3. **Login** as a user
4. **Open browser console** to see Socket.io connection logs
5. **Trigger an event** (e.g., send message, create event)
6. **See real-time notification** appear in top-right

### Connection Testing

Check Socket.io connection in browser console:
```javascript
// Should see:
// "Socket.io connection initiated"
// "Socket connected: <socket-id>"
// "Received notification: {...}"
```

### Backend Logs

Check backend logs for:
```
[INFO] Socket.io initialized
[INFO] Socket authenticated { socketId: '...', userId: 123 }
[INFO] User connected via socket
[DEBUG] Notification emitted via Socket.io
```

## Troubleshooting

### Socket Not Connecting

1. Check if user is authenticated (`isAuthenticated = true`)
2. Check `/auth/socket-token` endpoint returns a token with socket scope
   - Decode and verify `aud: "socket"` and `tokenType: "socket"`
3. Verify JWT_SECRET is configured
4. Check browser console for connection errors
5. Verify CORS settings allow frontend URL

### Notifications Not Appearing

1. Check Socket.io connection is active
2. Verify notification is being created in database
3. Check user is in correct room: `user:${userId}`
4. Verify i18n translation exists for notification type
5. Check NotifContainer is rendered in App

### Connection Keeps Dropping

1. Check firewall/proxy settings
2. Verify backend server is running
3. Check for JWT token expiration
4. Review reconnection settings in `socketService.ts`
5. Verify transports include websocket and polling

### API Response Formats

**Get Notifications** (`GET /api/notifications`)
- Response: `{ notifications: [...] }`
- Not a direct array

**Mark All as Read** (`PATCH /api/notifications/read-all`)
- Use PATCH method, not POST
- Path is `/read-all` not `/mark-all-read`
- Response: `{ message: "All notifications marked as read" }`

**Mark Single as Read** (`PATCH /api/notifications/:id/read`)
- Returns the updated notification object

## Performance Considerations

- **One connection per user**: Efficient use of WebSocket connections
- **Room-based targeting**: Only sends notifications to intended users
- **Automatic cleanup**: Disconnects on logout/unmount
- **Fallback to polling**: Works even if WebSocket is blocked
- **Batch notifications**: Use `createNotifications()` for multiple users

## Future Enhancements

Potential improvements:
- [ ] Notification preferences (mute certain types)
- [ ] Persistent notification center/inbox
- [ ] Desktop notifications API integration
- [ ] Sound/vibration on notification
- [ ] Mark notifications as read from backend endpoint
- [ ] Notification filtering and search
- [ ] Real-time typing indicators
- [ ] Presence system (online/offline status)

## Security

- ✅ JWT authentication required
- ✅ httpOnly cookies prevent XSS
- ✅ Token blacklist prevents replay attacks
- ✅ CORS configured for specific origin
- ✅ Users only receive their own notifications
- ✅ Room-based isolation prevents cross-user leaks

## Related Files

### Backend
- `backend/src/infrastructure/socket.ts`
- `backend/src/services/notificationService.ts`
- `backend/src/server.ts`
- `backend/src/controllers/authController.ts`
- `backend/src/routes/authRouter.ts`
- `backend/src/handlers/notifications/*`

### Frontend
- `frontend/src/services/socketService.ts`
- `frontend/src/context/NotificationContext.tsx`
- `frontend/src/components/features/Notif.tsx`
- `frontend/src/components/features/NotificationBadge.tsx`
- `frontend/src/App.tsx`
- `frontend/src/hooks/index.ts`

## Support

For issues or questions, refer to:
- Socket.io documentation: https://socket.io/docs/
- Project GitHub repository
- Backend logs in production
