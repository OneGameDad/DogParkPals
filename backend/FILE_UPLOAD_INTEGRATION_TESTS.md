# File Upload Integration Tests

This document summarizes the integration tests added for file upload functionality (profile pictures for users and dogs).

## Overview

File upload integration tests have been added to verify that users can successfully upload profile pictures and dogs can have photos added.

## Test Files Modified

### 1. [src/tests/integration/authUsers.test.ts](src/tests/integration/authUsers.test.ts)

**9 new profile picture upload tests added:**

- ✓ `upload profile picture succeeds with valid token` - User can upload their profile picture
- ✓ `upload profile picture fails without auth token` - Request without auth token returns 401
- ✓ `upload profile picture fails without file` - Request without file returns 400
- ✓ `get profile picture URL requires auth` - Accessing profile picture URL requires authentication
- ✓ `user can access own profile picture URL` - User can retrieve their own profile picture URL
- ✓ `admin can access any user's profile picture URL` - Admin can access any user's profile picture
- ✓ `non-owner cannot access another user's profile picture URL` - Non-owner/non-admin gets 403
- ✓ `delete profile picture succeeds for authenticated user` - User can delete their profile picture
- ✓ `delete profile picture fails without auth` - Delete request without auth returns 401

### 2. [src/tests/integration/dogs.test.ts](src/tests/integration/dogs.test.ts)

**12 new dog photo upload tests added:**

- ✓ `upload dog photo succeeds for dog owner` - Dog owner can upload photo for their dog
- ✓ `upload dog photo fails for non-owner` - Non-owner cannot upload photo (403)
- ✓ `upload dog photo fails for missing dog` - Uploading to non-existent dog returns 404
- ✓ `upload dog photo fails without auth` - Request without auth returns 401
- ✓ `upload dog photo fails without file` - Request without file returns 400
- ✓ `admin can upload dog photo for any dog` - Admin can upload photo for any dog
- ✓ `get dog photo URL requires auth` - Accessing photo URL requires authentication
- ✓ `authorized user can get dog photo URL` - Authorized user can retrieve photo URL
- ✓ `dog without photo returns 404 for owner` - Dog owner gets 404 when dog has no photo
- ✓ `accessing dog without authorization returns 403` - Non-owner gets 403 for authorization check
- ✓ `delete dog photo succeeds for owner` - Dog owner can delete the photo
- ✓ `delete dog photo fails for non-owner` - Non-owner cannot delete photo (403)

### 3. [src/tests/integration/setup.ts](src/tests/integration/setup.ts)

**Upload directory cleanup added:**

- Imports `rimraf` for directory cleanup
- Added cleanup in `afterEach()` hook to remove uploads directory between tests
- Added cleanup in `afterAll()` hook for final cleanup after all tests complete
- Prevents disk accumulation from test file uploads

### 4. [package.json](package.json)

**Dependencies updated:**

- Added `rimraf` (v6.0.1) for cross-platform directory cleanup

## Fixture Files Used

Both tests use existing fixture files located in [src/tests/fixtures/](src/tests/fixtures/):

- **Greg.png** - Used for user profile picture uploads
- **Helga.jpg** - Used for dog photo uploads

## Test Coverage

**Total new tests: 21**

- User profile picture functionality: 9 tests
- Dog photo functionality: 12 tests

**Scenarios covered:**

- ✅ Successful upload with valid authentication
- ✅ Upload failure without authentication
- ✅ Upload failure without file
- ✅ Upload permission verification (owner/admin only)
- ✅ Access control for retrieving file URLs
- ✅ File existence verification
- ✅ Delete operations with authorization checks
- ✅ Cleanup between test runs

## Running the Tests

Run specific test suites:

```bash
# Test user profile picture uploads
npm run test:integration -- src/tests/integration/authUsers.test.ts -t "profile picture"

# Test dog photo uploads
npm run test:integration -- src/tests/integration/dogs.test.ts -t "photo upload"

# Run all integration tests
npm run test:integration
```

## Implementation Details

### Upload Middleware

The tests utilize the existing `uploadSingleFile` middleware from [src/middlewares/uploadMiddleware.ts](src/middlewares/uploadMiddleware.ts) which:

- Validates file types (JPEG, PNG, PDF)
- Limits file size to 10MB
- Stores files in organized directories (images, documents, misc)
- Uses unique filenames with timestamps

### Controllers

**User Controller** - [src/controllers/userController.ts](src/controllers/userController.ts)
- `uploadProfilePicture()` - Handles profile picture uploads
- `deleteProfilePicture()` - Handles profile picture deletion

**Dog Controller** - [src/controllers/dogController.ts](src/controllers/dogController.ts)
- `uploadDogPhoto()` - Handles dog photo uploads
- `deleteDogPhoto()` - Handles dog photo deletion

### File Access Controller

**File Controller** - [src/controllers/fileController.ts](src/controllers/fileController.ts)
- `GET /api/files/users/:userId/profile-picture` - Retrieve user profile picture URL
- `GET /api/files/dogs/:dogId/photo` - Retrieve dog photo URL

### Routes

**User Router** - [src/routes/userRouter.ts](src/routes/userRouter.ts)
- `POST /users/profile-picture` - Upload profile picture
- `DELETE /users/profile-picture` - Delete profile picture

**Dog Router** - [src/routes/dogRouter.ts](src/routes/dogRouter.ts)
- `POST /api/dogs/:id/photo` - Upload dog photo
- `DELETE /api/dogs/:id/photo` - Delete dog photo

**File Router** - [src/routes/fileRouter.ts](src/routes/fileRouter.ts)
- `GET /api/files/users/:userId/profile-picture` - Get profile picture URL
- `GET /api/files/dogs/:dogId/photo` - Get dog photo URL

## Database Integration

Both user and dog entities have URL fields:
- **User.profilePictureUrl** - Stores path to user's profile picture
- **Dog.profilePictureUrl** - Stores path to dog's profile picture

These are managed by:
- [userService.uploadProfilePicture()](src/services/userServices.ts) - Stores URL in database
- [dogService.uploadDogPhoto()](src/services/dogService.ts) - Stores URL in database

## Notes

- Files are stored on disk in the `uploads` directory relative to the project root
- Test cleanup via rimraf ensures no disk space accumulation
- Authorization is checked before resource existence (security best practice)
- File paths are returned as relative URLs (e.g., `/api/files/users/6/profile-picture`)
