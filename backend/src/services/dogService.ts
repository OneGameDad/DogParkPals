import { PrismaClient, DogBreed, DogGender, DogPlaystyle, DogSize } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError } from '../utils/errors';
import { parseValidation } from '../utils/validator';
import { addDogSchema, updateDogSchema } from '../utils/validationSchemas';
import { createDomainEvent } from '../events/createDomainEvent';
import { EventTypes } from '../events/eventTypes';
import { addOutboxEvent } from '../infrastructure/outbox/outboxRepository';
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Implement dog-related services such as adding a dog, fetching dog profiles, updating dog information, etc.
const dogService = {
  // Add a new dog with validated enum types
  async addDog(dogData: unknown) {
    typeSafeLogger.logUserAction('Adding new dog', { breed: (dogData as any).breed });
    try {
      const validated = parseValidation(addDogSchema, dogData);
      
      // Convert dateOfBirth to Date if string
      const dateOfBirth = typeof validated.dateOfBirth === 'string' 
        ? new Date(validated.dateOfBirth) 
        : validated.dateOfBirth;

      const newDog = await prisma.$transaction(async (tx) => {
        const createdDog = await tx.dog.create({
          data: {
            name: validated.name,
            breed: validated.breed as DogBreed,
            gender: validated.gender as DogGender,
            dateOfBirth,
            playstyle: validated.playstyle as DogPlaystyle,
            size: validated.size as DogSize,
            fixed: validated.fixed,
            description: validated.description,
            profilePictureUrl: validated.profilePictureUrl,
            vaccinationRecordUrl: validated.vaccinationRecordUrl,
          },
        });

        const domainEvent = createDomainEvent(EventTypes.DogCreated, {
          dogId: createdDog.id,
          name: createdDog.name,
          ownerIds: [],
        });
        await addOutboxEvent(tx, domainEvent);

        return createdDog;
      });
      typeSafeLogger.logUserAction('Dog added successfully', { dogId: newDog.id, name: validated.name });
      return newDog;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to add dog',
        code: 'ADD_DOG_FAILED',
      });
      typeSafeLogger.logError('Failed to add dog', appError);
      throw appError;
    }
  },
  
  async getDogById(dogId: number) {
    typeSafeLogger.info('Fetching dog by ID', { dogId });
    try {
      const dog = await prisma.dog.findUnique({
        where: { id: dogId },
      });
      if (dog) {
        typeSafeLogger.logUserAction('Dog found by ID', { dogId });
      } else {
        typeSafeLogger.warn('Dog not found by ID', { dogId });
      }
      return dog;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch dog by ID',
        code: 'FETCH_DOG_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch dog by ID', appError, { dogId });
      throw appError;
    }
  },

  async getDogByOwner(userId: number) {
    typeSafeLogger.info('Fetching dogs by owner ID', { userId });
    try {
      const dogs = await prisma.dog.findMany({
        where: {
          ownerRecords: {
            some: {
              userId: userId,
            },
          },
        },
      });
      typeSafeLogger.logUserAction('Dogs fetched by owner ID', { userId, dogCount: dogs.length });
      return dogs;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch dogs by owner ID',
        code: 'FETCH_DOGS_BY_OWNER_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch dogs by owner ID', appError, { userId });
      throw appError;
    }
  },

  async getAllDogs() {
    typeSafeLogger.info('Fetching all dogs');
    try {
      const dogs = await prisma.dog.findMany();
      typeSafeLogger.logUserAction('All dogs fetched', { dogCount: dogs.length });
      return dogs;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch all dogs',
        code: 'FETCH_ALL_DOGS_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch all dogs', appError);
      throw appError;
    }
  },

  async getAllDogsByPark(parkId: number) {
    typeSafeLogger.info('Fetching all dogs by park ID', { parkId });
    try {
      const dogs = await prisma.dog.findMany({
        where: {
          checkIns: {
            some: {
              parkId: parkId,
              checkedOutAt: null, // Only dogs currently checked in
            },
          },
        },
      });
      typeSafeLogger.logUserAction('Dogs fetched by park ID', { parkId, dogCount: dogs.length });
      return dogs;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch dogs by park ID',
        code: 'FETCH_DOGS_BY_PARK_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch dogs by park ID', appError, { parkId });
      throw appError;
    }
  },

  async updateDog(dogId: number, updateData: unknown) {
    typeSafeLogger.logUserAction('Updating dog', { dogId, updateData });
    try {
      const validated = parseValidation(updateDogSchema, updateData);

      // Cast enum fields to proper types
      const data: any = {};
      if (validated.name !== undefined) data.name = validated.name;
      if (validated.breed !== undefined) data.breed = validated.breed as DogBreed;
      if (validated.gender !== undefined) data.gender = validated.gender as DogGender;
      if (validated.playstyle !== undefined) data.playstyle = validated.playstyle as DogPlaystyle;
      if (validated.size !== undefined) data.size = validated.size as DogSize;
      if (validated.fixed !== undefined) data.fixed = validated.fixed;
      if (validated.description !== undefined) data.description = validated.description;
      if (validated.profilePictureUrl !== undefined) data.profilePictureUrl = validated.profilePictureUrl;
      if (validated.vaccinationRecordUrl !== undefined) data.vaccinationRecordUrl = validated.vaccinationRecordUrl;
      if (validated.dateOfBirth !== undefined) {
        data.dateOfBirth = typeof validated.dateOfBirth === 'string'
          ? new Date(validated.dateOfBirth)
          : validated.dateOfBirth;
      }

      const updatedDog = await prisma.dog.update({
        where: { id: dogId },
        data,
      });
      typeSafeLogger.logUserAction('Dog updated successfully', { dogId });
      return updatedDog;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to update dog',
        code: 'UPDATE_DOG_FAILED',
      });
      typeSafeLogger.logError('Failed to update dog', appError, { dogId });
      throw appError;
    }
  },

  async deleteDog(dogId: number) {
    typeSafeLogger.logUserAction('Deleting dog', { dogId });
    try {
      await prisma.$transaction(async (tx) => {
        const existingDog = await tx.dog.findUnique({
          where: { id: dogId },
          select: { id: true, name: true },
        });

        const owners = await tx.dogOwner.findMany({
          where: { dogId },
          select: { userId: true },
        });

        await tx.dog.delete({
          where: { id: dogId },
        });

        const domainEvent = createDomainEvent(EventTypes.DogDeleted, {
          dogId,
          name: existingDog?.name,
          ownerIds: owners.map((owner) => owner.userId),
        });
        await addOutboxEvent(tx, domainEvent);
      });
      typeSafeLogger.logUserAction('Dog deleted successfully', { dogId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to delete dog',
        code: 'DELETE_DOG_FAILED',
      });
      typeSafeLogger.logError('Failed to delete dog', appError, { dogId });
      throw appError;
    }
  },

  async addOwnerToDog(dogId: number, userId: number) {
    typeSafeLogger.logUserAction('Adding owner to dog', { dogId, userId });
    try {
      await prisma.$transaction(async (tx) => {
        await tx.dogOwner.create({
          data: {
            dogId,
            userId,
          },
        });

        const domainEvent = createDomainEvent(
          EventTypes.DogOwnershipAdded,
          {
            dogId,
            userId,
          },
          { actorId: userId }
        );
        await addOutboxEvent(tx, domainEvent);
      });
      typeSafeLogger.logUserAction('Owner added to dog successfully', { dogId, userId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to add owner to dog',
        code: 'ADD_OWNER_TO_DOG_FAILED',
      });
      typeSafeLogger.logError('Failed to add owner to dog', appError, { dogId, userId });
      throw appError;
    }
  },

  async removeOwnerFromDog(dogId: number, userId: number) {
    typeSafeLogger.logUserAction('Removing owner from dog', { dogId, userId });
    try {
      await prisma.$transaction(async (tx) => {
        await tx.dogOwner.delete({
          where: {
            userId_dogId: {
              dogId,
              userId,
            },
          },
        });

        const domainEvent = createDomainEvent(
          EventTypes.DogOwnershipRemoved,
          {
            dogId,
            userId,
            removedBy: userId,
          },
          { actorId: userId }
        );
        await addOutboxEvent(tx, domainEvent);
      });
      typeSafeLogger.logUserAction('Owner removed from dog successfully', { dogId, userId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to remove owner from dog',
        code: 'REMOVE_OWNER_FROM_DOG_FAILED',
      });
      typeSafeLogger.logError('Failed to remove owner from dog', appError, { dogId, userId });
      throw appError;
    }
  },

  async getOwnersOfDog(dogId: number) {
    typeSafeLogger.info('Fetching owners of dog', { dogId });
    try {
      const owners = await prisma.user.findMany({
        where: {
          dogOwnerships: {
            some: {
              dogId: dogId,
            },
          },
        },
      });
      typeSafeLogger.logUserAction('Owners fetched for dog', { dogId, ownerCount: owners.length });
      return owners;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch owners of dog',
        code: 'FETCH_OWNERS_OF_DOG_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch owners of dog', appError, { dogId });
      throw appError;
    }
  },

  async uploadDogPhoto(dogId: number, filePath: string) {
    typeSafeLogger.logUserAction('Uploading dog photo', { dogId, filePath });
    try {
      const updatedDog = await prisma.$transaction(async (tx) => {
        const dog = await tx.dog.update({
          where: { id: dogId },
          data: {
            profilePictureUrl: filePath,
          },
        });
        const domainEvent = createDomainEvent(EventTypes.DogPhotoUploaded, {
          dogId,
          profilePictureUrl: dog.profilePictureUrl ?? filePath,
        });
        await addOutboxEvent(tx, domainEvent);
        return dog;
      });
      typeSafeLogger.logUserAction('Dog photo uploaded successfully', { dogId, filePath });
      return updatedDog;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to upload dog photo',
        code: 'UPLOAD_DOG_PHOTO_FAILED',
      });
      typeSafeLogger.logError('Failed to upload dog photo', appError, { dogId, filePath });
      throw appError;
    }
  },

  async uploadDocument(dogId: number, filePath: string) {
    typeSafeLogger.logUserAction('Uploading dog document', { dogId, filePath });
    try {
      const updatedDog = await prisma.$transaction(async (tx) => {
        const dog = await tx.dog.update({
          where: { id: dogId },
          data: {
            vaccinationRecordUrl: filePath,
          },
        });
        const domainEvent = createDomainEvent(EventTypes.DogDocumentUploaded, {
          dogId,
          vaccinationRecordUrl: dog.vaccinationRecordUrl ?? filePath,
        });
        await addOutboxEvent(tx, domainEvent);
        return dog;
      });
      typeSafeLogger.logUserAction('Dog document uploaded successfully', { dogId, filePath });
      return updatedDog;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to upload dog document',
        code: 'UPLOAD_DOG_DOCUMENT_FAILED',
      });
      typeSafeLogger.logError('Failed to upload dog document', appError, { dogId, filePath });
      throw appError;
    }
  },

  async deleteDogPhoto(dogId: number) {
    typeSafeLogger.logUserAction('Deleting dog photo', { dogId });
    try {
      const existingDog = await prisma.dog.findUnique({
        where: { id: dogId },
        select: { profilePictureUrl: true },
      });
      if (existingDog?.profilePictureUrl) {
        const filePath = path.join(__dirname, '../../', existingDog.profilePictureUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      const previousUrl = existingDog?.profilePictureUrl ?? null;
      const updatedDog = await prisma.$transaction(async (tx) => {
        const dog = await tx.dog.update({
          where: { id: dogId },
          data: {
            profilePictureUrl: null,
          },
        });
        const domainEvent = createDomainEvent(EventTypes.DogPhotoDeleted, {
          dogId,
          previousUrl,
        });
        await addOutboxEvent(tx, domainEvent);
        return dog;
      });
      typeSafeLogger.logUserAction('Dog photo deleted successfully', { dogId });
      return updatedDog;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to delete dog photo',
        code: 'DELETE_DOG_PHOTO_FAILED',
      });
      typeSafeLogger.logError('Failed to delete dog photo', appError, { dogId });
      throw appError;
    }
  },

  async deleteDocument(dogId: number) {
    typeSafeLogger.logUserAction('Deleting dog document', { dogId });
    try {
      const existingDog = await prisma.dog.findUnique({
        where: { id: dogId },
        select: { vaccinationRecordUrl: true },
      });
      if (existingDog?.vaccinationRecordUrl) {
        const filePath = path.join(__dirname, '../../', existingDog.vaccinationRecordUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      const previousUrl = existingDog?.vaccinationRecordUrl ?? null;
      const updatedDog = await prisma.$transaction(async (tx) => {
        const dog = await tx.dog.update({
          where: { id: dogId },
          data: {
            vaccinationRecordUrl: null,
          },
        });
        const domainEvent = createDomainEvent(EventTypes.DogDocumentDeleted, {
          dogId,
          previousUrl,
        });
        await addOutboxEvent(tx, domainEvent);
        return dog;
      });
      typeSafeLogger.logUserAction('Dog document deleted successfully', { dogId });
      return updatedDog;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to delete dog document',
        code: 'DELETE_DOG_DOCUMENT_FAILED',
      });
      typeSafeLogger.logError('Failed to delete dog document', appError, { dogId });
      throw appError;
    }
  },
};
export default dogService;