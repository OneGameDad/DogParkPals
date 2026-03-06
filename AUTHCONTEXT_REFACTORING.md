# Auth Context Refactoring Plan

## Current Architecture Issues

### 1. **Multiple Hook Instances Problem**
Currently, `useAuth()` is a standalone hook that creates **separate local state in each component** that calls it:

- **App.tsx (AppContent)** - Creates instance #1
- **NotificationContext** - Creates instance #2  
- **ProtectedRoute** - Creates instance #3
- **useParkCheckIn hook** - Creates instance #4
- **Home.tsx** - Creates instance #5

Each instance independently:
- Calls `/auth/me` endpoint (multiple redundant API calls)
- Maintains its own auth state (`isAuthenticated`, `user`, `loading`)
- Listens to `auth:login` and `auth:logout` events
- Can drift out of sync with other instances

### 2. **Performance Concerns**
- Multiple `/auth/me` calls happening simultaneously on app load
- No single source of truth for auth state
- Event listeners only update the specific component instance
- Logout/login events may not propagate consistently across app

---

## Refactoring Plan

### Step 1: Create AuthContext + AuthProvider
**File:** `frontend/src/context/AuthContext.tsx`

Create a context provider that:
- Holds auth state at the app level (single instance)
- Makes the `/auth/me` call once at app startup
- Broadcasts auth state changes to all consumers
- Manages `auth:login`/`auth:logout` events centrally

**Structure:**
```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<...> = ({ children }) => {
  // Single source of truth for auth state
  // Uses useEffect to call /auth/me once
  // Manages event listeners once
}

export const useAuth = () => {
  // Consumes context instead of creating local state
}
```

### Step 2: Update App.tsx
- Import `AuthProvider`
- Wrap the Router with `AuthProvider`
- Keep `AppContent` structure but remove `useAuth` from there initially (optional)

**Current structure:**
```tsx
<NotificationProvider>
  <AppContent />
</NotificationProvider>
```

**New structure:**
```tsx
<AuthProvider>
  <NotificationProvider>
    <AppContent />
  </NotificationProvider>
</AuthProvider>
```

### Step 3: Update Imports
No changes needed! The `useAuth` hook signature stays the same:
```typescript
const { isAuthenticated, user, loading, refreshUser } = useAuth();
```

But internally it will consume context instead of creating local state.

---

## Files That Need Changes

| File | Current Usage | Change Type |
|------|---------------|-------------|
| `frontend/src/context/AuthContext.tsx` | **NEW** | Create context provider |
| `frontend/src/hooks/useAuth.ts` | Hook implementation | Refactor to use context |
| `frontend/src/App.tsx` | Imports & wraps components | Wrap with `AuthProvider` |
| `frontend/src/context/NotificationContext.tsx` | Uses `useAuth()` | No code change (works with context) |
| `frontend/src/components/features/ProtectedRoute.tsx` | Uses `useAuth()` | No code change (works with context) |
| `frontend/src/hooks/parks/useParkCheckIn.ts` | Uses `useAuth()` | No code change (works with context) |
| `frontend/src/pages/Home.tsx` | Uses `useAuth()` | No code change (works with context) |
| `frontend/src/context/__tests__/NotificationContext.test.tsx` | Mocks useAuth | Update mock to use context |

---

## Benefits After Refactoring

✅ **Single `/auth/me` call** - Only runs once at app startup  
✅ **Shared auth state** - All components see the same user/auth state  
✅ **Consistent event propagation** - Login/logout events update one source of truth  
✅ **Better performance** - Eliminates redundant API calls  
✅ **Simplified testing** - Mock a single provider instead of multiple hook instances  
✅ **Backward compatible** - All current usages work unchanged  

---

## Implementation Steps

1. Create `AuthContext.tsx` with `AuthProvider` and new `useAuth` implementation
2. Update `hooks/useAuth.ts` to wrap the context hook (or replace it entirely)
3. Update `App.tsx` to wrap router with `AuthProvider`
4. Test that all components properly receive auth state
5. Update test mocks if needed
6. Remove the `DEV_FORCE_LOGIN` flag and log statements as cleanup (optional)

