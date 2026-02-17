
import { PrismaClient, Prisma } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { NotFoundError, toAppError } from '../utils/errors';
import { createParkSchema, updateParkSchema } from '../utils/validationSchemas';
import { createDomainEvent } from '../events/createDomainEvent';
import { EventTypes } from '../events/eventTypes';
import { addOutboxEvent } from '../infrastructure/outbox/outboxRepository';

const prisma = new PrismaClient();

//TODO parkService.ts
// Implement park-related services such as creating parks, fetching park details, updating park info, etc.
const parkService = {
  
  async getParkById(parkId: number) {
    typeSafeLogger.info('Fetching park by ID', { parkId });
    try {
      const park = await prisma.park.findUnique({
        where: { id: parkId },
      });
      if (park) {
        typeSafeLogger.logUserAction('Park found by ID', { parkId });
      } else {
        typeSafeLogger.warn('Park not found by ID', { parkId });
      }
      return park;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch park by ID',
        code: 'FETCH_PARK_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch park by ID', appError, { parkId });
      throw appError;
    }
  },

  async getParkByName(name: string) {
    typeSafeLogger.info('Fetching park by name', { name });
    try {
      const park = await prisma.park.findFirst({
        where: { name },
      });
      if (park) {
        typeSafeLogger.logUserAction('Park found by name', { name, parkId: park.id });
      } else {
        typeSafeLogger.warn('Park not found by name', { name });
      }
      return park;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch park by name',
        code: 'FETCH_PARK_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch park by name', appError, { name });
      throw appError;
    }
  },
  
  async getParksNearLocation(latitude: number, longitude: number, radiusInKm: number) {
    typeSafeLogger.info('Fetching parks near location', { latitude, longitude, radiusInKm });
    try {
        const sql = Prisma.sql`
            SELECT *, 
            (6371 * acos(cos(radians(${latitude})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${longitude})) + 
            sin(radians(${latitude})) * sin(radians(latitude)))) AS distance 
            FROM Park 
            HAVING distance < ${radiusInKm} 
            ORDER BY distance;
        `;
        const nearbyParks = await prisma.$queryRaw<Array<{ id: number; name: string; latitude: number; longitude: number; distance: number }>>(sql);
        typeSafeLogger.logUserAction('Nearby parks retrieved', { count: nearbyParks.length });
        return nearbyParks;
    } catch (error) {
        const appError = toAppError(error, {
            message: 'Failed to fetch nearby parks',
            code: 'FETCH_NEARBY_PARKS_FAILED',
        });
        typeSafeLogger.logError('Failed to fetch nearby parks', appError, { latitude, longitude, radiusInKm });
        throw appError;
    }
  },

  async getAllParks() {
    typeSafeLogger.info('Fetching all parks');
    try {
      const parks = await prisma.park.findMany();
      typeSafeLogger.logUserAction('All parks retrieved', { parkCount: parks.length });
      return parks;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch all parks',
        code: 'FETCH_ALL_PARKS_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch all parks', appError);
      throw appError;
    }
  },

  async getParksByAmenity(amenity: string) {
    typeSafeLogger.info('Fetching parks by amenity', { amenity });
    try {
      // Fetch all parks and filter in JavaScript since SQLite JSON filtering is limited
      const allParks = await prisma.park.findMany();
      const parks = allParks.filter(park => {
        if (!park.amenities) return false;
        const amenitiesArray = Array.isArray(park.amenities) 
          ? park.amenities 
          : [];
        return amenitiesArray.includes(amenity);
      });
      typeSafeLogger.logUserAction('Parks retrieved by amenity', { amenity, parkCount: parks.length });
      return parks;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch parks by amenity',
        code: 'FETCH_PARKS_BY_AMENITY_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch parks by amenity', appError, { amenity });
      throw appError;
    }
  },

  async createPark(data: { name: string; latitude: number; longitude: number; description?: string; separateSmallDogArea?: boolean; amenities?: string[] }) {
    typeSafeLogger.logUserAction('Creating park', { name: data.name });
    try {
      // Validate input data
      const validatedData = createParkSchema.parse(data);

      const newPark = await prisma.park.create({
        data: validatedData,
      });
      typeSafeLogger.logUserAction('Park created successfully', { parkId: newPark.id, name: newPark.name });
      return newPark;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to create park',
        code: 'CREATE_PARK_FAILED',
      });
      typeSafeLogger.logError('Failed to create park', appError, { name: data.name });
      throw appError;
    }
  },

  async updatePark(parkId: number, updates: { name?: string; latitude?: number; longitude?: number; description?: string; separateSmallDogArea?: boolean; amenities?: string[] }) {
    typeSafeLogger.logUserAction('Updating park', { parkId, updates });
    try {
      // Validate input data
      const validatedUpdates = updateParkSchema.parse(updates);

      const updatedPark = await prisma.park.update({
        where: { id: parkId },
        data: validatedUpdates,
      });
      typeSafeLogger.logUserAction('Park updated successfully', { parkId });
      return updatedPark;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to update park',
        code: 'UPDATE_PARK_FAILED',
      });
      typeSafeLogger.logError('Failed to update park', appError, { parkId });
      throw appError;
    }
  },

  async deletePark(parkId: number) {
    typeSafeLogger.logUserAction('Deleting park', { parkId });
    try {
      await prisma.$transaction(async (tx) => {
        const park = await tx.park.findUnique({
          where: { id: parkId },
          select: { id: true, name: true },
        });

        const favorites = await tx.userFavoritePark.findMany({
          where: { parkId },
          select: { userId: true },
        });

        await tx.park.delete({
          where: { id: parkId },
        });

        const domainEvent = createDomainEvent(EventTypes.ParkDeleted, {
          parkId,
          name: park?.name,
          favoriteUserIds: favorites.map((favorite) => favorite.userId),
        });
        await addOutboxEvent(tx, domainEvent);
      });
      typeSafeLogger.logUserAction('Park deleted successfully', { parkId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to delete park',
        code: 'DELETE_PARK_FAILED',
      });
      typeSafeLogger.logError('Failed to delete park', appError, { parkId });
      throw appError;
    }
  },

  async parkExists(parkId: number) {
    typeSafeLogger.info('Checking if park exists', { parkId });
    try {
      const count = await prisma.park.count({
        where: { id: parkId },
      });
      const exists = count > 0;
      typeSafeLogger.logUserAction('Park existence check completed', { parkId, exists });
      return exists;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to check if park exists',
        code: 'CHECK_PARK_EXISTS_FAILED',
      });
      typeSafeLogger.logError('Failed to check if park exists', appError, { parkId });
      throw appError;
    }
  },

  async addParkToUserFavorites(userId: number, parkId: number) {
    typeSafeLogger.logUserAction('Adding park to user favorites', { userId, parkId });
    try {
      await prisma.userFavoritePark.create({
        data: {
          userId,
          parkId,
        },
      });
      typeSafeLogger.logUserAction('Park added to user favorites successfully', { userId, parkId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to add park to user favorites',
        code: 'ADD_PARK_TO_FAVORITES_FAILED',
      });
      typeSafeLogger.logError('Failed to add park to user favorites', appError, { userId, parkId });
      throw appError;
    }
  },

  async getUserFavoriteParks(userId: number) {
    typeSafeLogger.logUserAction('Fetching user favorite parks', { userId });
    try {
      const favorites = await prisma.userFavoritePark.findMany({
        where: { userId },
        include: { park: true },
      });
      const parks = favorites.map((favorite) => favorite.park);
      typeSafeLogger.logUserAction('User favorite parks retrieved', { userId, parkCount: parks.length });
      return parks;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch user favorite parks',
        code: 'FETCH_USER_FAVORITE_PARKS_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch user favorite parks', appError, { userId });
      throw appError;
    }
  },
  
  async removeParkFromUserFavorites(userId: number, parkId: number) {
    typeSafeLogger.logUserAction('Removing park from user favorites', { userId, parkId });
    try {
      await prisma.userFavoritePark.deleteMany({
        where: {
          userId,
          parkId,
        },
      });
      typeSafeLogger.logUserAction('Park removed from user favorites successfully', { userId, parkId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to remove park from user favorites',
        code: 'REMOVE_PARK_FROM_FAVORITES_FAILED',
      });
      typeSafeLogger.logError('Failed to remove park from user favorites', appError, { userId, parkId });
      throw appError;
    }
  },

  async checkIn (userId: number, parkId: number, dogId?: number) {
    typeSafeLogger.logUserAction('User attempting to check in', { userId, parkId, dogId });
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        userId,
        checkedOutAt: null,
      },
    });
    if (existingCheckIn) {
      throw new Error('User already has an active check-in.'); // TODO: or USER_ALREADY_CHECKED_IN?
    }

    try {
      const newCheckIn = await prisma.$transaction(async (tx) => {
        const createdCheckIn = await tx.checkIn.create({
          data: {
            userId,
            parkId,
            dogId,
          },
        });

        const domainEvent = createDomainEvent(
          EventTypes.ParkCheckedIn,
          {
            checkInId: createdCheckIn.id,
            userId: createdCheckIn.userId,
            parkId: createdCheckIn.parkId,
            dogId: createdCheckIn.dogId,
          },
          { actorId: createdCheckIn.userId }
        );
        await addOutboxEvent(tx, domainEvent);

        return createdCheckIn;
      });
      typeSafeLogger.logUserAction('Check-in created successfully', { checkInId: newCheckIn.id });
      return newCheckIn;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to check in',
        code: 'CHECK_IN_FAILED',
      });
      typeSafeLogger.logError('Check-in failed', appError, { userId, parkId, dogId });
      throw appError;
    }
  },

  async checkOut (userId: number, parkId: number) {
    typeSafeLogger.logUserAction("User attempting to check out", { userId, parkId });
    try {
      const updatedCheckIn = await prisma.$transaction(async (tx) => {
        const activeCheckIn = await tx.checkIn.findFirst({
          where: {
            userId,
            parkId,
            checkedOutAt: null,
          },
        });
        if (!activeCheckIn) {
          throw NotFoundError("No active check-in found for this park");
        }
        const updated = await tx.checkIn.update({
          where: { id: activeCheckIn.id },
          data: {
            checkedOutAt: new Date(),
          },
        });

        const domainEvent = createDomainEvent(
          EventTypes.ParkCheckedOut,
          {
            checkInId: updated.id,
            userId: updated.userId,
            parkId: updated.parkId,
          },
          { actorId: updated.userId }
        );
        await addOutboxEvent(tx, domainEvent);

        return updated;
      });
      typeSafeLogger.logUserAction("User checked out successfully", {
        checkInId: updatedCheckIn.id,
        userId,
        parkId,
      });
      return updatedCheckIn;
    } catch (error) {
      const appError = toAppError(error, {
        message: "Failed to check out",
        code: "CHECK_OUT_FAILED",
      });
      typeSafeLogger.logError("Check-out failed", appError, { userId, parkId });
      throw appError;
    }
  },

  async getActiveCheckInsForPark(parkId: number) {
    typeSafeLogger.info('Fetching active check-ins for park', { parkId });
    try {
      const activeCheckIns = await prisma.checkIn.findMany({
        where: {
          parkId,
          checkedOutAt: null,
        },
        include: {
          user: true,
          dog: true,
        },
      });
      typeSafeLogger.logUserAction('Active check-ins retrieved', { parkId, count: activeCheckIns.length });
      return activeCheckIns;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch active check-ins',
        code: 'FETCH_ACTIVE_CHECKINS_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch active check-ins', appError, { parkId });
      throw appError;
    }
  },

  async getStaleCheckIns(beforeDate: Date) {
    return prisma.checkIn.findMany({
      where: {
        checkedOutAt: null,
        checkedInAt: { lt: beforeDate },
      },
    });
  },

  async autoCheckOut(checkInId: number) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.checkIn.update({
        where: { id: checkInId },
        data: { checkedOutAt: new Date() },
      });

      const domainEvent = createDomainEvent(
        EventTypes.ParkAutoCheckedOut,
        {
          checkInId: updated.id,
          checkedOutAt: updated.checkedOutAt?.toISOString() ?? new Date().toISOString(),
        }
      );
      await addOutboxEvent(tx, domainEvent);

      return updated;
    });
  }
};

export default parkService;