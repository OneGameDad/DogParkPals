import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import * as parkServiceModule from '../services/parkService';
import { runAutoCheckOutJob } from '../jobs/autoCheckoutJob';

jest.mock('../services/parkService');

const mockedParkService = parkServiceModule as jest.Mocked<typeof parkServiceModule>;

describe('park auto-checkout job', () => {
    beforeEach(() => {
        jest.clearAllMocks();
      });
    // No users checked in
    test('does nothing when no users are checked in', async () => {
    mockedParkService.default.getStaleCheckIns.mockResolvedValue([]);
    mockedParkService.default.autoCheckOut.mockResolvedValue({} as any);
    await runAutoCheckOutJob();

    expect(mockedParkService.default.getStaleCheckIns).toHaveBeenCalled();
    expect(mockedParkService.default.autoCheckOut).not.toHaveBeenCalled();
  });

  // A stale check in
  test('checks out a user who has been checked in for over an hour', async () => {
    const staleCheckIn = {
      id: 42,
      userId: 1,
      parkId: 1,
      dogId: 123,
      checkedInAt: new Date(Date.now() - 3600_000), // 1 hour ago
    };

    mockedParkService.default.getStaleCheckIns.mockResolvedValue([staleCheckIn]);
    mockedParkService.default.autoCheckOut.mockResolvedValue({
        ...staleCheckIn,
        checkedOutAt: new Date(),
      });

    await runAutoCheckOutJob();

    expect(mockedParkService.default.getStaleCheckIns).toHaveBeenCalled();
    expect(mockedParkService.default.autoCheckOut).toHaveBeenCalledWith(42);
  });

  // A fresh and a stale check-in
  test('only checks out stale check-ins when some are stale and some are not', async () => {
    const now = new Date();

    const staleCheckIn = {
      id: 1,
      userId: 1,
      parkId: 1,
      dogId: 101,
      checkedInAt: new Date(now.getTime() - 2 * 3600_000), // 2 hours ago
    };

    const freshCheckIn = {
      id: 2,
      userId: 2,
      parkId: 1,
      dogId: 102,
      checkedInAt: new Date(now.getTime() - 30 * 60_000), // 30 minutes ago
    };

    mockedParkService.default.getStaleCheckIns.mockResolvedValue([staleCheckIn]);
    mockedParkService.default.autoCheckOut.mockResolvedValue({
      ...staleCheckIn,
      checkedOutAt: now,
    });

    await runAutoCheckOutJob();

    expect(mockedParkService.default.getStaleCheckIns).toHaveBeenCalled();
    expect(mockedParkService.default.autoCheckOut).toHaveBeenCalledTimes(1);
    expect(mockedParkService.default.autoCheckOut).toHaveBeenCalledWith(staleCheckIn.id);
  });

  // Stale check-ins at different parks
  test('checks out stale check-ins at multiple parks', async () => {
    const now = new Date();
    const staleCheckInPark1 = {
      id: 101,
      userId: 1,
      parkId: 1,
      dogId: 201,
      checkedInAt: new Date(now.getTime() - 2 * 3600_000), // 2 hours ago
    };
    const staleCheckInPark2 = {
      id: 102,
      userId: 1,
      parkId: 2,
      dogId: 201,
      checkedInAt: new Date(now.getTime() - 90 * 60_000), // 1.5 hours ago
    };
  
    mockedParkService.default.getStaleCheckIns.mockResolvedValue([
      staleCheckInPark1,
      staleCheckInPark2,
    ]);
  
    mockedParkService.default.autoCheckOut.mockImplementation(async (id: number) => {
      return [staleCheckInPark1, staleCheckInPark2].find(ci => ci.id === id)!;
    });
  
    await runAutoCheckOutJob();
  
    expect(mockedParkService.default.getStaleCheckIns).toHaveBeenCalled();
  
    expect(mockedParkService.default.autoCheckOut).toHaveBeenCalledTimes(2);
    expect(mockedParkService.default.autoCheckOut).toHaveBeenCalledWith(101);
    expect(mockedParkService.default.autoCheckOut).toHaveBeenCalledWith(102);
  });
});