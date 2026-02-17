# Event Catalog

This catalog summarizes domain events emitted via the outbox and their current handlers.

## Envelope (all events)
- `id`: UUID
- `type`: event name
- `occurredAt`: ISO timestamp
- `actorId`: optional user id
- `payload`: event-specific payload
- `version`: integer
- `traceId`: optional trace id

## Events

### event.created
- Payload: `eventId`, `parkId`, `organizerId`, `organizationId?`, `title`
- Emitted by: `eventService.createEvent`
- Handlers: `notifications.eventCreated`, `logging.eventCreated`

### event.attended
- Payload: `eventId`, `userId`
- Emitted by: `eventService.attendEvent`
- Handlers: `achievements.eventAttended`

### event.deleted
- Payload: `eventId`, `organizerId?`, `organizationId?`, `parkId?`, `title?`, `attendeeIds[]`
- Emitted by: `eventService.deleteEvent`
- Handlers: `notifications.eventDeleted`

### achievement.awarded
- Payload: `userId`, `achievementId`, `name`, `type`
- Emitted by: `achievementService.awardAchievementToUser`
- Handlers: `notifications.achievementAwarded`, `logging.achievementAwarded`

### user.role.updated
- Payload: `targetUserId`, `role`, `adminUserId`
- Emitted by: `userService.changeUserRole`
- Handlers: `notifications.userRoleUpdated`, `logging.userRoleUpdated`

### user.profile.updated
- Payload: `userId`, `fields[]`, `updatedBy?`, `username?`
- Emitted by: `userService.updateUserProfile`, `userService.changeUsername`
- Handlers: `notifications.userProfileUpdated`, `logging.userProfileUpdated`

### user.profile.picture.uploaded
- Payload: `userId`, `profilePictureUrl`
- Emitted by: `userService.uploadProfilePicture`
- Handlers: `notifications.userProfilePictureUploaded`, `logging.userProfilePictureUploaded`

### user.profile.picture.deleted
- Payload: `userId`, `previousUrl`
- Emitted by: `userService.deleteProfilePicture`
- Handlers: `notifications.userProfilePictureDeleted`, `logging.userProfilePictureDeleted`

### friend.request.sent
- Payload: `friendshipId`, `requesterId?`, `addresseeId?`, `requesterDogId?`, `addresseeDogId?`
- Emitted by: `friendService.sendFriendRequest` (pending only)
- Handlers: `notifications.friendRequestSent`, `logging.friendRequestSent`

### friend.request.accepted
- Payload: `friendshipId`, `requesterId?`, `addresseeId?`
- Emitted by: `friendService.acceptFriendRequest`, `friendService.sendFriendRequest` (auto-accept)
- Handlers: `notifications.friendRequestAccepted`, `achievements.friendRequestAccepted`, `logging.friendRequestAccepted`

### friend.removed
- Payload: `userId?`, `friendId?`, `dogId?`, `friendDogId?`, `removedBy?`
- Emitted by: `friendService.removeFriend`, `enemyService.confirmAddEnemy`
- Handlers: `notifications.friendRemoved`

### organization.join.requested
- Payload: `organizationId`, `requesterId`
- Emitted by: `organizationService.joinOrganization`
- Handlers: `notifications.organizationJoinRequested`, `logging.organizationJoinRequested`

### organization.join.approved
- Payload: `organizationId`, `userId`, `role`
- Emitted by: `organizationService.addMember`
- Handlers: `notifications.organizationJoinApproved`, `achievements.organizationJoinApproved`, `logging.organizationJoinApproved`

### organization.role.updated
- Payload: `organizationId`, `userId`, `role`
- Emitted by: `organizationService.updateMemberRole`
- Handlers: `notifications.organizationRoleUpdated`, `logging.organizationRoleUpdated`

### organization.member.removed
- Payload: `organizationId`, `userId`, `removedBy?`
- Emitted by: `organizationService.removeMember`
- Handlers: `notifications.organizationMemberRemoved`

### organization.deleted
- Payload: `organizationId`, `memberIds[]`, `deletedBy?`
- Emitted by: `organizationService.deleteOrganization`
- Handlers: `notifications.organizationDeleted`

### dog.created
- Payload: `dogId`, `name`, `ownerIds[]?`
- Emitted by: `dogService.addDog`
- Handlers: `notifications.dogCreated`

### dog.deleted
- Payload: `dogId`, `name?`, `ownerIds[]`, `deletedBy?`
- Emitted by: `dogService.deleteDog`
- Handlers: `notifications.dogDeleted`

### dog.ownership.added
- Payload: `dogId`, `userId`
- Emitted by: `dogService.addOwnerToDog`
- Handlers: `notifications.dogOwnershipAdded`, `achievements.dogOwnershipAdded`, `logging.dogOwnershipAdded`

### dog.ownership.removed
- Payload: `dogId`, `userId`, `removedBy?`
- Emitted by: `dogService.removeOwnerFromDog`
- Handlers: `notifications.dogOwnershipRemoved`

### dog.photo.uploaded
- Payload: `dogId`, `profilePictureUrl`
- Emitted by: `dogService.uploadDogPhoto`
- Handlers: `notifications.dogPhotoUploaded`, `logging.dogPhotoUploaded`

### dog.photo.deleted
- Payload: `dogId`, `previousUrl?`
- Emitted by: `dogService.deleteDogPhoto`
- Handlers: `notifications.dogPhotoDeleted`, `logging.dogPhotoDeleted`

### dog.document.uploaded
- Payload: `dogId`, `vaccinationRecordUrl`
- Emitted by: `dogService.uploadDocument`
- Handlers: `logging.dogDocumentUploaded`

### dog.document.deleted
- Payload: `dogId`, `previousUrl?`
- Emitted by: `dogService.deleteDocument`
- Handlers: `logging.dogDocumentDeleted`

### message.sent
- Payload: `messageId`, `senderId`, `receiverId`
- Emitted by: `messageService.sendMessage`
- Handlers: `notifications.messageSent`, `logging.messageSent`

### park.checked_in
- Payload: `checkInId`, `userId`, `parkId`, `dogId?`
- Emitted by: `parkService.checkIn`
- Handlers: `notifications.parkCheckedIn`, `logging.parkCheckedIn`

### park.checked_out
- Payload: `checkInId`, `userId`, `parkId`
- Emitted by: `parkService.checkOut`
- Handlers: `logging.parkCheckedOut`

### park.auto_checked_out
- Payload: `checkInId`, `checkedOutAt`
- Emitted by: `parkService.autoCheckOut`
- Handlers: `logging.parkAutoCheckedOut`

### park.deleted
- Payload: `parkId`, `name?`, `favoriteUserIds[]`, `deletedBy?`
- Emitted by: `parkService.deletePark`
- Handlers: `notifications.parkDeleted`

### enemy.added
- Payload: `enemyId`, `ownerId`, `enemyUserId`
- Emitted by: `enemyService.addEnemy`, `enemyService.confirmAddEnemy`
- Handlers: `achievements.enemyAdded`, `logging.enemyAdded`

### enemy.removed
- Payload: `ownerId`, `enemyUserId`
- Emitted by: `enemyService.removeEnemy`
- Handlers: `notifications.enemyRemoved`, `logging.enemyRemoved`

### job.failed
- Payload: `jobName`, `errorMessage`, `errorStack?`, `context?`
- Emitted by: `eventConsumer.startEventConsumer`, `outboxPublisher.processOutboxOnce`, `outboxPublisher.startOutboxPublisher`, `autoCheckoutJob.runAutoCheckOutJob`
- Handlers: `logging.jobFailed`

### backup.started
- Payload: `backupId`, `target?`, `storage?`
- Emitted by: `backupEventCli`
- Handlers: `logging.backupStarted`

### backup.succeeded
- Payload: `backupId`, `target?`, `storage?`, `sizeBytes?`, `durationMs?`
- Emitted by: `backupEventCli`
- Handlers: `logging.backupSucceeded`

### backup.failed
- Payload: `backupId`, `target?`, `storage?`, `errorMessage`, `errorStack?`
- Emitted by: `backupEventCli`
- Handlers: `logging.backupFailed`
