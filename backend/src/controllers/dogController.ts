import express from "express";
import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError, ConflictError, NotFoundError, ForbiddenError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import dogService from "../services/dogService";
import { addDogSchema } from "../utils/validationSchemas";

/**
 * Check if user is authorized to modify a dog (owner, admin, or developer)
 */
async function checkDogAuthorization(dogId: number, userId: number | undefined, userRole: string | undefined) {
  const dog = await dogService.getDogById(dogId);
  if (!dog) {
    throw NotFoundError("Dog not found");
  }
  
  const owners = await dogService.getOwnersOfDog(dogId);
  const isOwner = owners.some(owner => owner.id === userId);
  const isAdmin = userRole === 'ADMIN' || userRole === 'DEVELOPER';
  
  if (!isOwner && !isAdmin) {
    throw ForbiddenError("Not authorized to modify this dog");
  }
  
  return dog;
}

const dogController = {
  addDog: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to add dog", { method: req.method, path: req.path });
      const dogData = parseValidation(addDogSchema, req.body);

      const newDog = await dogService.addDog(dogData);
      typeSafeLogger.logUserAction("Dog added", { dogId: newDog.id, name: newDog.name });
      res.status(201).json(newDog);
    } catch (error) {
      return next(
        toAppError(error, { message: "Failed to add dog", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  getDogById: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to fetch dog by ID", { method: req.method, path: req.path });
      const dogId = parseInt(req.params.id, 10);

      const dog = await dogService.getDogById(dogId);
      if (!dog) {
        throw NotFoundError("Dog not found");
      }
      typeSafeLogger.logUserAction("Dog retrieved", { dogId: dog.id });
      res.status(200).json(dog);
    } catch (error) {
      return next(
        toAppError(error, { message: "Failed to retrieve dog", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  getDogByOwner: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to fetch dogs by owner", { method: req.method, path: req.path });
      const ownerId = parseInt(req.params.ownerId, 10);

      const dogs = await dogService.getDogByOwner(ownerId);
      typeSafeLogger.logUserAction("Dogs retrieved for owner", { ownerId, dogCount: dogs.length });
      res.status(200).json(dogs);
    } catch (error) {
      return next(
        toAppError(error, { message: "Failed to retrieve dogs by owner", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  getAllDogs: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to fetch all dogs", { method: req.method, path: req.path });

      const dogs = await dogService.getAllDogs();
      typeSafeLogger.logUserAction("All dogs retrieved", { dogCount: dogs.length });
      res.status(200).json(dogs);
    } catch (error) {
      return next(
        toAppError(error, { message: "Failed to retrieve all dogs", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  getAllDogsByPark: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      typeSafeLogger.logRequest("Received request to fetch all dogs by park", { method: req.method, path: req.path });
      const parkId = parseInt(req.params.parkId, 10);

      const dogs = await dogService.getAllDogsByPark(parkId);
      typeSafeLogger.logUserAction("Dogs retrieved for park", { parkId, dogCount: dogs.length });
      res.status(200).json(dogs);
    } catch (error) {
      return next(
        toAppError(error, { message: "Failed to retrieve dogs by park", code: "INTERNAL_ERROR", statusCode: 500 })
      );
    }
  },

  updateDog: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const dogId = parseInt(req.params.id, 10);
        await checkDogAuthorization(dogId, req.user?.id, req.user?.role);
        
        const updatedDog = await dogService.updateDog(dogId, req.body);
        res.status(200).json(updatedDog);
        } catch (error) {
            return next(toAppError(error, { message: "Failed to update dog", code: "INTERNAL_ERROR", statusCode: 500 }));
        }
    },

    deleteDog: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
        const dogId = parseInt(req.params.id, 10);
        await checkDogAuthorization(dogId, req.user?.id, req.user?.role);
        
        await dogService.deleteDog(dogId);
        res.status(204).send();
        } catch (error) {
            return next(toAppError(error, { message: "Failed to delete dog", code: "INTERNAL_ERROR", statusCode: 500 }));
        }
    },

    addOwnerToDog: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
    const dogId = parseInt(req.params.id, 10);
    await checkDogAuthorization(dogId, req.user?.id, req.user?.role);
    
    await dogService.addOwnerToDog(dogId, req.body.userId);
    res.status(204).send();
    } catch (error) {
        return next(toAppError(error, { message: "Failed to add owner to dog", code: "INTERNAL_ERROR", statusCode: 500 }));
    }
  },

  removeOwnerFromDog: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const dogId = parseInt(req.params.id, 10);
        await checkDogAuthorization(dogId, req.user?.id, req.user?.role);
        
        await dogService.removeOwnerFromDog(dogId, req.body.userId);
        res.status(204).send();
        } catch (error) {
            return next(toAppError(error, { message: "Failed to remove owner from dog", code: "INTERNAL_ERROR", statusCode: 500 }));
        }
    }
};

export default dogController;