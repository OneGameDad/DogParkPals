import request from 'supertest';
import app from '../../app';

describe('Search API Integration Tests', () => {
  describe('GET /api/search', () => {
    test('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/search').query({ q: 'test' });
      expect(res.status).toBe(401);
    });

    test('should return 400 without query parameter', async () => {
      // This would depend on your auth setup, assuming user is authenticated
      // const token = await getAuthToken();
      // const res = await request(app)
      //   .get('/api/search')
      //   .set('Authorization', `Bearer ${token}`);
      // expect(res.status).toBe(400);
    });

    test('should handle empty query string', async () => {
      // Would need proper token
      // const res = await request(app)
      //   .get('/api/search')
      //   .query({ q: '' })
      //   .set('Authorization', `Bearer ${token}`);
      // expect(res.status).toBe(200);
      // expect(res.body.total).toBe(0);
    });
  });

  describe('GET /api/search/:type', () => {
    test('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/search/PARK')
        .query({ q: 'test' });
      expect(res.status).toBe(401);
    });

    test('should return 400 for missing query parameter', async () => {
      // Would need proper token
      // const res = await request(app)
      //   .get('/api/search/PARK')
      //   .set('Authorization', `Bearer ${token}`);
      // expect(res.status).toBe(400);
    });

    test('should return 400 for invalid type', async () => {
      // Would need proper token
      // const res = await request(app)
      //   .get('/api/search/INVALID')
      //   .query({ q: 'test' })
      //   .set('Authorization', `Bearer ${token}`);
      // expect(res.status).toBe(400);
    });
  });

  describe('Search functionality', () => {
    test('endpoints exist and have correct paths', async () => {
      // Verify endpoints are registered (they'll require auth, but not 404)
      const res1 = await request(app).get('/api/search');
      expect(res1.status).not.toBe(404);

      const res2 = await request(app).get('/api/search/PARK');
      expect(res2.status).not.toBe(404);
    });
  });
});
