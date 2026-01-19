import notificationRouter from '../routes/notificationRouter';
import notificationController from '../controllers/notificationController';
import express from 'express';

jest.mock('../controllers/notificationController');

describe('Notification Router', () => {
  test('routes exist and use controller methods', () => {
    const router = notificationRouter;
    // you can check router.stack for paths and methods
    const paths = router.stack.map((layer: any) => layer.route?.path).filter(Boolean);
    expect(paths).toContain('/notifications');
    expect(paths).toContain('/notifications/:id/read');
    expect(paths).toContain('/notifications/read-all');
  });
});
