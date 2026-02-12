import parkService from "../services/parkService";
import { NotFoundError, ForbiddenError, isAppError } from "../utils/errors";
import { Request, Response, NextFunction } from "express";
import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import { createParkSchema, updateParkSchema, getParksNearLocationSchema } from "../utils/validationSchemas";
import { awardParkPatrolIfEligible, awardExperience, hasVisitedParkBefore, XP_REWARDS } from "../services/xpService";

/**
 * Check if user is authorized to modify a park (admin, or developer)
 */
async function checkParkAuthorization(parkId: number, userRole: string | undefined) {
  const park = await parkService.getParkById(parkId);
  if (!park) {
    throw NotFoundError("Park not found");
  }
  
  const isAdmin = userRole === 'ADMIN' || userRole === 'DEVELOPER';
  
  if (!isAdmin) {
    throw ForbiddenError("Not authorized to modify this park");
  }
  
  return park;
}

function requireAdmin(userRole: string | undefined) {
  const isAdmin = userRole === 'ADMIN' || userRole === 'DEVELOPER';
  if (!isAdmin) {
    throw ForbiddenError('Not authorized to perform this action');
  }
}

const parkController = {
    getParkById: async (req: Request, res: Response, next: NextFunction) => {
      try {
        typeSafeLogger.logRequest("Received request to fetch park by ID", { method: req.method, path: req.path });
        const parkId = parseInt(req.params.id, 10);

        const park = await parkService.getParkById(parkId);
        if (!park) {
          throw NotFoundError("Park not found");
        }
        typeSafeLogger.logUserAction("Park retrieved", { parkId: park.id });
        res.status(200).json(park);
      } catch (error) {
        if (isAppError(error)) {
          return next(error);
        }
        return next(
          toAppError(error, { message: "Failed to retrieve park", code: "INTERNAL_ERROR", statusCode: 500 })
        );
      }
    },

    getParksNearLocation: async (req: Request, res: Response, next: NextFunction) => {
      try {
        typeSafeLogger.logRequest("Received request to fetch parks near location", { method: req.method, path: req.path });
        
        const { latitude, longitude, radiusInKm } = parseValidation(getParksNearLocationSchema, {
          latitude: parseFloat(req.query.latitude as string),
          longitude: parseFloat(req.query.longitude as string),
          radiusInKm: parseFloat(req.query.radiusInKm as string),
        });

        const parks = await parkService.getParksNearLocation(latitude, longitude, radiusInKm);
        typeSafeLogger.logUserAction("Parks retrieved near location", { parkCount: parks.length });
        res.status(200).json(parks);
      } catch (error) {
        if (isAppError(error)) {
          return next(error);
        }
        return next(
          toAppError(error, { message: "Failed to retrieve parks near location", code: "INTERNAL_ERROR", statusCode: 500 })
        );
      }
    },

    getParksByAmenity: async (req: Request, res: Response, next: NextFunction) => {
      try {
        typeSafeLogger.logRequest("Received request to fetch parks by amenity", { method: req.method, path: req.path });
        const amenity = req.query.amenity as string;

        const parks = await parkService.getParksByAmenity(amenity);
        typeSafeLogger.logUserAction("Parks retrieved by amenity", { amenity, parkCount: parks.length });
        res.status(200).json(parks);
      } catch (error) {
        if (isAppError(error)) {
          return next(error);
        }
        return next(
          toAppError(error, { message: "Failed to retrieve parks by amenity", code: "INTERNAL_ERROR", statusCode: 500 })
        );
      }
    },

    getParkByName: async (req: Request, res: Response, next: NextFunction) => {
      try {
        typeSafeLogger.logRequest("Received request to fetch park by name", { method: req.method, path: req.path });
        const name = req.params.name;

        const park = await parkService.getParkByName(name);
        if (!park) {
          throw NotFoundError("Park not found");
        }
        typeSafeLogger.logUserAction("Park retrieved by name", { parkId: park.id, name });
        res.status(200).json(park);
      } catch (error) {
        if (isAppError(error)) {
          return next(error);
        }
        return next(
          toAppError(error, { message: "Failed to retrieve park by name", code: "INTERNAL_ERROR", statusCode: 500 })
        );
      }
    },

    getAllParks: async (req: Request, res: Response, next: NextFunction) => {
      try {
        typeSafeLogger.logRequest("Received request to fetch all parks", { method: req.method, path: req.path });

        const parks = await parkService.getAllParks();
        typeSafeLogger.logUserAction("All parks retrieved", { parkCount: parks.length });
        res.status(200).json(parks);
      } catch (error) {
        if (isAppError(error)) {
          return next(error);
        }
        return next(
          toAppError(error, { message: "Failed to retrieve all parks", code: "INTERNAL_ERROR", statusCode: 500 })
        );
      }
    },

    getUserFavoriteParks: async (req: Request, res: Response, next: NextFunction) => {
      try {
        typeSafeLogger.logRequest("Received request to fetch user favorite parks", { method: req.method, path: req.path });
        const userId = parseInt(req.params.userId, 10);

        const caller = (req as any).user;
        const isAdmin = caller?.role === 'ADMIN' || caller?.role === 'DEVELOPER';
        if (!caller || (caller.id !== userId && !isAdmin)) {
          throw ForbiddenError('Not authorized to view favorites for this user');
        }

        const favorites = await parkService.getUserFavoriteParks(userId);
        typeSafeLogger.logUserAction("User favorite parks retrieved", { userId, parkCount: favorites.length });
        res.status(200).json(favorites);
      } catch (error) {
        if (isAppError(error)) {
          return next(error);
        }
        return next(
          toAppError(error, { message: "Failed to retrieve user favorite parks", code: "INTERNAL_ERROR", statusCode: 500 })
        );
      }
    },

    addParkToUserFavorites: async (req: Request, res: Response, next: NextFunction) => {
      try {
        typeSafeLogger.logRequest("Received request to add park to user favorites", { method: req.method, path: req.path });
        const userId = parseInt(req.params.userId, 10);
        const parkId = parseInt(req.params.parkId, 10);

        const caller = (req as any).user;
        const isAdmin = caller?.role === 'ADMIN' || caller?.role === 'DEVELOPER';
        if (!caller || (caller.id !== userId && !isAdmin)) {
          throw ForbiddenError('Not authorized to modify favorites for this user');
        }

        const parkExists = await parkService.parkExists(parkId);
        if (!parkExists) {
          throw NotFoundError('Park not found');
        }

        await parkService.addParkToUserFavorites(userId, parkId);
        typeSafeLogger.logUserAction("Park added to user favorites", { userId, parkId });
        res.status(200).json({ message: "Park added to favorites" });
      } catch (error) {
        if (isAppError(error)) {
          return next(error);
        }
        return next(
          toAppError(error, { message: "Failed to add park to user favorites", code: "INTERNAL_ERROR", statusCode: 500 })
        );
      }
    },

    removeParkFromUserFavorites: async (req: Request, res: Response, next: NextFunction) => {
      try {
        typeSafeLogger.logRequest("Received request to remove park from user favorites", { method: req.method, path: req.path });
        const userId = parseInt(req.params.userId, 10);
        const parkId = parseInt(req.params.parkId, 10);

        const caller = (req as any).user;
        const isAdmin = caller?.role === 'ADMIN' || caller?.role === 'DEVELOPER';
        if (!caller || (caller.id !== userId && !isAdmin)) {
          throw ForbiddenError('Not authorized to modify favorites for this user');
        }

        const parkExists = await parkService.parkExists(parkId);
        if (!parkExists) {
          throw NotFoundError('Park not found');
        }

        await parkService.removeParkFromUserFavorites(userId, parkId);
        typeSafeLogger.logUserAction("Park removed from user favorites", { userId, parkId });
        res.status(200).json({ message: "Park removed from favorites" });
      } catch (error) {
        if (isAppError(error)) {
          return next(error);
        }
        return next(
          toAppError(error, { message: "Failed to remove park from user favorites", code: "INTERNAL_ERROR", statusCode: 500 })
        );
      }
    },
    createPark: async (req: Request, res: Response, next: NextFunction) => {
      try {
        typeSafeLogger.logRequest("Received request to create park", { method: req.method, path: req.path });
        
        // Validate request body
          const userRole = (req as any).user?.role;
          requireAdmin(userRole);
        const validatedData = createParkSchema.parse(req.body);

        const newPark = await parkService.createPark(validatedData);
        typeSafeLogger.logUserAction("Park created", { parkId: newPark.id, name: newPark.name });
        res.status(201).json(newPark);
      } catch (error) {
        if (isAppError(error)) {
          return next(error);
        }
        return next(
          toAppError(error, { message: "Failed to create park", code: "INTERNAL_ERROR", statusCode: 500 })
        );
      }
    },

    updatePark: async (req: Request, res: Response, next: NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to update park", { method: req.method, path: req.path });
            const parkId = parseInt(req.params.id, 10);
            const userRole = (req as any).user?.role;
            await checkParkAuthorization(parkId, userRole);

            // Validate request body
            const validatedUpdates = updateParkSchema.parse(req.body);
            const updatedPark = await parkService.updatePark(parkId, validatedUpdates);
            typeSafeLogger.logUserAction("Park updated", { parkId });
            res.status(200).json(updatedPark);
        } catch (error) {
            if (isAppError(error)) {
              return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to update park", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    deletePark: async (req: Request, res: Response, next: NextFunction) => {
      try {
        typeSafeLogger.logRequest("Received request to delete park", { method: req.method, path: req.path });
        const parkId = parseInt(req.params.id, 10);
        const userRole = (req as any).user?.role;
        await checkParkAuthorization(parkId, userRole);

        await parkService.deletePark(parkId);
        typeSafeLogger.logUserAction("Park deleted", { parkId });
        res.status(204).send();
      } catch (error) {
        if (isAppError(error)) {
          return next(error);
        }
        return next(
          toAppError(error, { message: "Failed to delete park", code: "INTERNAL_ERROR", statusCode: 500 })
        );
      }
    },

    checkInAtPark: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req as any).user?.id;
        const parkId = parseInt(req.params.parkId, 10);
        const dogId = req.body.dogId ? parseInt(req.body.dogId, 10) : undefined;

        if (!userId) {
          throw ForbiddenError('Authentication required');
        }

        const parkExists = await parkService.parkExists(parkId);
        if (!parkExists) {
          throw NotFoundError('Park not found');
        }

        const checkIn = await parkService.checkIn(userId, parkId, dogId);
        await awardExperience(userId, XP_REWARDS.PARK_VISIT, 'park_visit');
        const visitedBefore = await hasVisitedParkBefore(userId, parkId, checkIn.id);
        if (!visitedBefore) {
          await awardExperience(userId, XP_REWARDS.NEW_PARK_BONUS, 'new_park_visit');
        }
        await awardParkPatrolIfEligible(userId, parkId);
        res.status(201).json(checkIn);
      } catch (error) {
        if (isAppError(error)) {
          return next(error);
        }
        return next(
          toAppError(error, { message: "Failed to check in", code: "INTERNAL_ERROR", statusCode: 500 })
        );
      }
    },

    checkOutFromPark: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req as any).user?.id;
        const parkId = parseInt(req.params.parkId, 10);

        const parkExists = await parkService.parkExists(parkId);
        if (!parkExists) {
          throw NotFoundError('Park not found');
        }

        const checkOut = await parkService.checkOut(userId, parkId);
        res.status(200).json(checkOut);
      } catch (error) {
        if (isAppError(error)) {
          return next(error);
        }
        return next(
          toAppError(error, {
            message: "Failed to check out",
            code: "INTERNAL_ERROR",
            statusCode: 500,
          })
        );
      }
    },

    getActiveCheckInsForPark: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parkId = parseInt(req.params.parkId, 10);
        const activeCheckIns = await parkService.getActiveCheckInsForPark(parkId);

        res.status(200).json(activeCheckIns);
      } catch (error) {
        if (isAppError(error)) {
          return next(error);
        }
        return next(
          toAppError(error, { message: 'Failed to get active check-ins', code: 'INTERNAL_ERROR', statusCode: 500 })
        );
      }
    }
};

export default parkController;