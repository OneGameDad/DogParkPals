
import { PrismaClient, Prisma } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError } from '../utils/errors';
import { createParkSchema, updateParkSchema } from '../utils/validationSchemas';

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
      await prisma.park.delete({
        where: { id: parkId },
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

};

export default parkService;