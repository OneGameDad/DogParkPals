import request from 'supertest';
import app from '../../app';
import { makeToken, ids } from '../fixtures/integrationFixtures';

const adminToken = () => makeToken({ id: ids.users.admin, role: 'ADMIN' });
const userAToken = () => makeToken({ id: ids.users.userA, role: 'CLIENT' });
const orgMemberToken = () => makeToken({ id: ids.users.orgMember, role: 'CLIENT' });

describe('Search API Integration Tests', () => {
  describe('GET /api/search', () => {
    test('should require authentication', async () => {
      const res = await request(app).get('/api/search').query({ q: 'test' });
      expect(res.status).toBe(401);
    });

    test('should return 400 without query parameter', async () => {
      const res = await request(app)
        .get('/api/search')
        .set('Authorization', `Bearer ${userAToken()}`);
      expect(res.status).toBe(400);
    });

    test('should handle empty query string', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: '' })
        .set('Authorization', `Bearer ${userAToken()}`);
      expect(res.status).toBe(400);
    });

    test('should search across all entity types', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'central' })
        .set('Authorization', `Bearer ${userAToken()}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('parks');
      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('dogs');
      expect(res.body).toHaveProperty('organizations');
      expect(res.body).toHaveProperty('events');
      expect(res.body).toHaveProperty('total');
      expect(res.body.parks.length).toBeGreaterThan(0);
      expect(res.body.parks[0].name).toMatch(/central/i);
    });

    test('should filter by specific type', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'bark', type: 'PARK' })
        .set('Authorization', `Bearer ${userAToken()}`);
      
      expect(res.status).toBe(200);
      expect(res.body.parks.length).toBeGreaterThan(0);
      expect(res.body.users.length).toBe(0);
      expect(res.body.dogs.length).toBe(0);
    });

    test('should respect pagination limits', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'user', limit: 2 })
        .set('Authorization', `Bearer ${userAToken()}`);
      
      expect(res.status).toBe(200);
      expect(res.body.users.length).toBeLessThanOrEqual(2);
    });

    test('should enforce max limit of 50', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'user', limit: 100 })
        .set('Authorization', `Bearer ${userAToken()}`);
      
      expect(res.status).toBe(200);
      // Max 50 per type is enforced in service
      expect(res.body.users.length).toBeLessThanOrEqual(50);
    });

    test('should show public events to all users', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'meetup' })
        .set('Authorization', `Bearer ${userAToken()}`);
      
      expect(res.status).toBe(200);
      const publicEvents = res.body.events.filter((e: any) => e.private === 'PUBLIC');
      expect(publicEvents.length).toBeGreaterThan(0);
    });

    test('should hide private events from non-members', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'training' })
        .set('Authorization', `Bearer ${userAToken()}`);
      
      expect(res.status).toBe(200);
      // userA is not the organizer of the private event
      const privateEvents = res.body.events.filter(
        (e: any) => e.private === 'PRIVATE' && e.organizerId !== ids.users.userA
      );
      expect(privateEvents.length).toBe(0);
    });

    test('should show all events to admin', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'training' })
        .set('Authorization', `Bearer ${adminToken()}`);
      
      expect(res.status).toBe(200);
      // Admin sees all events including private ones
      const allEvents = res.body.events;
      expect(allEvents.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/search/:type', () => {
    test('should require authentication', async () => {
      const res = await request(app)
        .get('/api/search/PARK')
        .query({ q: 'test' });
      expect(res.status).toBe(401);
    });

    test('should return 400 for missing query parameter', async () => {
      const res = await request(app)
        .get('/api/search/PARK')
        .set('Authorization', `Bearer ${userAToken()}`);
      expect(res.status).toBe(400);
    });

    test('should return 400 for invalid type', async () => {
      const res = await request(app)
        .get('/api/search/INVALID')
        .query({ q: 'test' })
        .set('Authorization', `Bearer ${userAToken()}`);
      expect(res.status).toBe(400);
    });

    test('should search parks by name', async () => {
      const res = await request(app)
        .get('/api/search/PARK')
        .query({ q: 'central' })
        .set('Authorization', `Bearer ${userAToken()}`);
      
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('PARK');
      expect(res.body.results.length).toBeGreaterThan(0);
      expect(res.body.results[0].entityType).toBe('PARK');
      expect(res.body.results[0].name).toMatch(/central/i);
    });

    test('should search users by username', async () => {
      const res = await request(app)
        .get('/api/search/USER')
        .query({ q: 'admin' })
        .set('Authorization', `Bearer ${userAToken()}`);
      
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('USER');
      expect(res.body.results.length).toBeGreaterThan(0);
      expect(res.body.results[0].entityType).toBe('USER');
      expect(res.body.results[0].username).toMatch(/admin/i);
    });

    test('should search dogs by name', async () => {
      const res = await request(app)
        .get('/api/search/DOG')
        .query({ q: 'rex' })
        .set('Authorization', `Bearer ${userAToken()}`);
      
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('DOG');
      expect(res.body.results.length).toBeGreaterThan(0);
      expect(res.body.results[0].entityType).toBe('DOG');
      expect(res.body.results[0].name).toMatch(/rex/i);
    });

    test('should search organizations', async () => {
      const res = await request(app)
        .get('/api/search/ORGANIZATION')
        .query({ q: 'org' })
        .set('Authorization', `Bearer ${userAToken()}`);
      
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('ORGANIZATION');
      expect(res.body.results.length).toBeGreaterThan(0);
      expect(res.body.results[0].entityType).toBe('ORGANIZATION');
    });

    test('should show member role for organization members', async () => {
      const res = await request(app)
        .get('/api/search/ORGANIZATION')
        .query({ q: 'org' })
        .set('Authorization', `Bearer ${orgMemberToken()}`);
      
      expect(res.status).toBe(200);
      const orgResult = res.body.results.find((o: any) => o.id === ids.orgs.org1);
      expect(orgResult).toBeDefined();
      expect(orgResult.memberRole).toBeDefined(); // Member sees their role
    });

    test('should search events', async () => {
      const res = await request(app)
        .get('/api/search/EVENT')
        .query({ q: 'meetup' })
        .set('Authorization', `Bearer ${userAToken()}`);
      
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('EVENT');
      expect(res.body.results.length).toBeGreaterThan(0);
      expect(res.body.results[0].entityType).toBe('EVENT');
    });

    test('should respect pagination offset', async () => {
      const res1 = await request(app)
        .get('/api/search/PARK')
        .query({ q: 'park', limit: 1, offset: 0 })
        .set('Authorization', `Bearer ${userAToken()}`);
      
      const res2 = await request(app)
        .get('/api/search/PARK')
        .query({ q: 'park', limit: 1, offset: 1 })
        .set('Authorization', `Bearer ${userAToken()}`);
      
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      
      if (res1.body.results.length > 0 && res2.body.results.length > 0) {
        expect(res1.body.results[0].id).not.toBe(res2.body.results[0].id);
      }
    });
  });
});
