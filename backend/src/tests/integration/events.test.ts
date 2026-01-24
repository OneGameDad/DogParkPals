import request from "supertest";
import app from "../../app";
import { ids, makeToken } from "../fixtures/integrationFixtures";

const adminToken = () => makeToken({ id: ids.users.admin, role: "ADMIN" });
const developerToken = () => makeToken({ id: ids.users.developer, role: "DEVELOPER" });
const orgOwnerToken = () => makeToken({ id: ids.users.orgOwner, role: "CLIENT" });
const orgModeratorToken = () => makeToken({ id: ids.users.orgModerator, role: "CLIENT" });
const memberToken = () => makeToken({ id: ids.users.orgMember, role: "CLIENT" });
const userBToken = () => makeToken({ id: ids.users.userB, role: "CLIENT" });

const futureWindow = () => {
  const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    date: start.toISOString(),
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
};

describe("events CRUD and authorization", () => {
  test("create event succeeds for authenticated user", async () => {
    const times = futureWindow();

    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${orgOwnerToken()}`)
      .send({
        title: "Evening Play",
        description: "Test event",
        parkId: ids.parks.park3,
        organizerId: ids.users.orgOwner,
        private: "PUBLIC",
        ...times,
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Evening Play");
    expect(res.body.organizerId).toBe(ids.users.orgOwner);
  });

  test("update event allowed for organizer", async () => {
    const res = await request(app)
      .put(`/api/events/${ids.events.event1}`)
      .set("Authorization", `Bearer ${orgOwnerToken()}`)
      .send({ description: "Organizer updated" });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe("Organizer updated");
  });

  test("update event allowed for admin", async () => {
    const res = await request(app)
      .put(`/api/events/${ids.events.event2}`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ title: "Admin edit" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Admin edit");
  });

  test("update event forbidden for non-organizer", async () => {
    const res = await request(app)
      .put(`/api/events/${ids.events.event1}`)
      .set("Authorization", `Bearer ${userBToken()}`)
      .send({ title: "Should fail" });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  test("update event not found", async () => {
    const res = await request(app)
      .put("/api/events/99999")
      .set("Authorization", `Bearer ${developerToken()}`)
      .send({ title: "Missing" });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  test("delete event allowed for admin", async () => {
    const res = await request(app)
      .delete(`/api/events/${ids.events.event1}`)
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(204);
  });

  test("delete event forbidden for non-organizer", async () => {
    const res = await request(app)
      .delete(`/api/events/${ids.events.event1}`)
      .set("Authorization", `Bearer ${memberToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  test("delete event not found", async () => {
    const res = await request(app)
      .delete("/api/events/99999")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  test("get event by id", async () => {
    const res = await request(app)
      .get(`/api/events/${ids.events.event1}`)
      .set("Authorization", `Bearer ${orgOwnerToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ids.events.event1);
  });

  test("get event by id not found", async () => {
    const res = await request(app)
      .get("/api/events/99999")
      .set("Authorization", `Bearer ${orgOwnerToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  test("list events by organizer", async () => {
    const res = await request(app)
      .get(`/api/events/organizer/${ids.users.orgOwner}`)
      .set("Authorization", `Bearer ${orgModeratorToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const idsByOrganizer = res.body.map((e: any) => e.id);
    expect(idsByOrganizer).toContain(ids.events.event1);
  });

  test("list events by organization returns array", async () => {
    const res = await request(app)
      .get(`/api/events/organization/${ids.orgs.org1}`)
      .set("Authorization", `Bearer ${orgOwnerToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("list events by park", async () => {
    const res = await request(app)
      .get(`/api/events/park/${ids.parks.park1}`)
      .set("Authorization", `Bearer ${orgOwnerToken()}`);

    expect(res.status).toBe(200);
    const eventIds = res.body.map((e: any) => e.id);
    expect(eventIds).toContain(ids.events.event1);
  });

  test("list all events", async () => {
    const res = await request(app)
      .get("/api/events")
      .set("Authorization", `Bearer ${orgOwnerToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test("list upcoming events filters past", async () => {
    const res = await request(app)
      .get("/api/events/upcoming")
      .set("Authorization", `Bearer ${orgOwnerToken()}`);

    expect(res.status).toBe(200);
    const eventIds = res.body.map((e: any) => e.id);
    expect(eventIds).toContain(ids.events.event1);
    expect(eventIds).not.toContain(ids.events.event2);
  });

  test("check event existence", async () => {
    const existsRes = await request(app)
      .get(`/api/events/${ids.events.event1}/is-event`)
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(existsRes.status).toBe(200);
    expect(existsRes.body.exists).toBe(true);

    const missingRes = await request(app)
      .get("/api/events/99999/is-event")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(missingRes.status).toBe(200);
    expect(missingRes.body.exists).toBe(false);
  });
});

  describe("concurrent event operations", () => {
    test("concurrent event creation with unique titles succeed", async () => {
      const futureWindow = () => {
        const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        return {
          date: start.toISOString(),
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        };
      };

      const [evt1, evt2, evt3] = await Promise.all([
        request(app)
          .post("/api/events")
          .set("Authorization", `Bearer ${orgOwnerToken()}`)
          .send({
            title: `Concurrent Event 1 ${Date.now()}`,
            description: "Test",
            parkId: ids.parks.park1,
            organizerId: ids.users.orgOwner,
            private: "PUBLIC",
            ...futureWindow(),
          }),
        request(app)
          .post("/api/events")
          .set("Authorization", `Bearer ${orgOwnerToken()}`)
          .send({
            title: `Concurrent Event 2 ${Date.now()}`,
            description: "Test",
            parkId: ids.parks.park2,
            organizerId: ids.users.orgOwner,
            private: "PUBLIC",
            ...futureWindow(),
          }),
        request(app)
          .post("/api/events")
          .set("Authorization", `Bearer ${memberToken()}`)
          .send({
            title: `Concurrent Event 3 ${Date.now()}`,
            description: "Test",
            parkId: ids.parks.park3,
            organizerId: ids.users.orgMember,
            private: "PUBLIC",
            ...futureWindow(),
          })
      ]);

      // All should succeed
      expect(evt1.status).toBe(201);
      expect(evt2.status).toBe(201);
      expect(evt3.status).toBe(201);

      // Verify unique event IDs
      const eventIds = new Set([evt1.body.id, evt2.body.id, evt3.body.id]);
      expect(eventIds.size).toBe(3);
    });

    test("concurrent event updates succeed independently", async () => {
      // Create two events first
      const futureWindow = () => {
        const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        return {
          date: start.toISOString(),
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        };
      };

      const evt1Res = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${orgOwnerToken()}`)
        .send({
          title: `Update Test Event 1 ${Date.now()}`,
          description: "Initial description",
          parkId: ids.parks.park1,
          organizerId: ids.users.orgOwner,
          private: "PUBLIC",
          ...futureWindow(),
        });

      const evt2Res = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${memberToken()}`)
        .send({
          title: `Update Test Event 2 ${Date.now()}`,
          description: "Another description",
          parkId: ids.parks.park2,
          organizerId: ids.users.orgMember,
          private: "PUBLIC",
          ...futureWindow(),
        });

      const evt1Id = evt1Res.body.id;
      const evt2Id = evt2Res.body.id;

      // Update both concurrently
      const [update1, update2] = await Promise.all([
        request(app)
          .put(`/api/events/${evt1Id}`)
          .set("Authorization", `Bearer ${orgOwnerToken()}`)
          .send({ description: "Updated by organizer" }),
        request(app)
          .put(`/api/events/${evt2Id}`)
          .set("Authorization", `Bearer ${adminToken()}`)
          .send({ description: "Updated by admin" })
      ]);

      expect(update1.status).toBe(200);
      expect(update2.status).toBe(200);
      expect(update1.body.description).toBe("Updated by organizer");
      expect(update2.body.description).toBe("Updated by admin");
    });
  });
