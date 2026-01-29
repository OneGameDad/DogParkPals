import request from "supertest";
import app from "../../app";
import { ids, makeToken } from "../fixtures/integrationFixtures";

const adminToken = () => makeToken({ id: ids.users.admin, role: "ADMIN" });
const developerToken = () => makeToken({ id: ids.users.developer, role: "DEVELOPER" });
const userAToken = () => makeToken({ id: ids.users.userA, role: "CLIENT" });
const userBToken = () => makeToken({ id: ids.users.userB, role: "CLIENT" });

const newParkPayload = () => ({
  name: "Test Park",
  latitude: 10.1,
  longitude: 20.2,
  description: "Integration created",
  separateSmallDogArea: true,
  amenities: ["WATER_FOUNTAIN", "BENCHES"],
});

describe("parks and check-ins", () => {
  test("get park by id succeeds", async () => {
    const res = await request(app)
      .get(`/api/parks/${ids.parks.park1}`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ids.parks.park1);
  });

  test("get park by id not found", async () => {
    const res = await request(app)
      .get("/api/parks/99999")
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(404);
  });

  test("create park admin succeeds", async () => {
    const res = await request(app)
      .post("/api/parks")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send(newParkPayload());

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test Park");
  });

  test("create park forbidden for non-admin", async () => {
    const res = await request(app)
      .post("/api/parks")
      .set("Authorization", `Bearer ${userAToken()}`)
      .send(newParkPayload());

    expect(res.status).toBe(403);
  });

  test("update park admin succeeds", async () => {
    const res = await request(app)
      .put(`/api/parks/${ids.parks.park1}`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ description: "Updated by admin" });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe("Updated by admin");
  });

  test("update park forbidden for non-admin", async () => {
    const res = await request(app)
      .put(`/api/parks/${ids.parks.park1}`)
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({ description: "Should fail" });

    expect(res.status).toBe(403);
  });

  test("update park not found", async () => {
    const res = await request(app)
      .put("/api/parks/99999")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ description: "Missing" });

    expect(res.status).toBe(404);
  });

  test("delete park admin succeeds", async () => {
    const createRes = await request(app)
      .post("/api/parks")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send(newParkPayload());

    const res = await request(app)
      .delete(`/api/parks/${createRes.body.id}`)
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(204);
  });

  test("delete park forbidden for non-admin", async () => {
    const res = await request(app)
      .delete(`/api/parks/${ids.parks.park2}`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(403);
  });

  test("delete park not found", async () => {
    const res = await request(app)
      .delete("/api/parks/99999")
      .set("Authorization", `Bearer ${developerToken()}`);

    expect(res.status).toBe(404);
  });

  test("add park to favorites succeeds for self", async () => {
    const res = await request(app)
      .post(`/api/parks/favorites/${ids.users.userA}/${ids.parks.park1}`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/added/i);
  });

  test("add park to favorites forbidden for other user", async () => {
    const res = await request(app)
      .post(`/api/parks/favorites/${ids.users.userA}/${ids.parks.park1}`)
      .set("Authorization", `Bearer ${userBToken()}`);

    expect(res.status).toBe(403);
  });

  test("add park to favorites not found park", async () => {
    const res = await request(app)
      .post(`/api/parks/favorites/${ids.users.userA}/99999`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(404);
  });

  test("remove park from favorites succeeds for self", async () => {
    await request(app)
      .post(`/api/parks/favorites/${ids.users.userA}/${ids.parks.park2}`)
      .set("Authorization", `Bearer ${userAToken()}`);

    const res = await request(app)
      .delete(`/api/parks/favorites/${ids.users.userA}/${ids.parks.park2}`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/removed/i);
  });

  test("remove park from favorites forbidden for other user", async () => {
    const res = await request(app)
      .delete(`/api/parks/favorites/${ids.users.userA}/${ids.parks.park1}`)
      .set("Authorization", `Bearer ${userBToken()}`);

    expect(res.status).toBe(403);
  });

  test("get favorite parks succeeds for self", async () => {
    await request(app)
      .post(`/api/parks/favorites/${ids.users.userA}/${ids.parks.park1}`)
      .set("Authorization", `Bearer ${userAToken()}`);

    const res = await request(app)
      .get(`/api/parks/favorites/${ids.users.userA}`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((park: { id: number }) => park.id === ids.parks.park1)).toBe(true);
  });

  test("get favorite parks forbidden for other user", async () => {
    const res = await request(app)
      .get(`/api/parks/favorites/${ids.users.userA}`)
      .set("Authorization", `Bearer ${userBToken()}`);

    expect(res.status).toBe(403);
  });

  test("check in and out succeeds", async () => {
    const checkInRes = await request(app)
      .post(`/api/parks/${ids.parks.park1}/check-in`)
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({ dogId: ids.dogs.dogA });

    expect(checkInRes.status).toBe(201);
    expect(checkInRes.body.parkId).toBe(ids.parks.park1);

    const checkOutRes = await request(app)
      .post(`/api/parks/${ids.parks.park1}/check-out`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(checkOutRes.status).toBe(200);
    expect(checkOutRes.body.checkedOutAt).toBeTruthy();
  });

  test("check out without active check-in returns 404", async () => {
    const res = await request(app)
      .post(`/api/parks/${ids.parks.park2}/check-out`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(404);
  });

  test("check in missing park returns 404", async () => {
    const res = await request(app)
      .post("/api/parks/99999/check-in")
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({});

    expect(res.status).toBe(404);
  });

  test("get active check-ins returns empty list when no users checked in", async () => {
    const res = await request(app)
      .get(`/api/parks/${ids.parks.park3}/check-ins`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test("multiple users check in at same park and get active check-ins", async () => {
    // User A checks in with dog A
    const checkInARes = await request(app)
      .post(`/api/parks/${ids.parks.park3}/check-in`)
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({ dogId: ids.dogs.dogA });

    expect(checkInARes.status).toBe(201);
    expect(checkInARes.body.userId).toBe(ids.users.userA);
    expect(checkInARes.body.dogId).toBe(ids.dogs.dogA);

    // User B checks in with dog B
    const checkInBRes = await request(app)
      .post(`/api/parks/${ids.parks.park3}/check-in`)
      .set("Authorization", `Bearer ${userBToken()}`)
      .send({ dogId: ids.dogs.dogB });

    expect(checkInBRes.status).toBe(201);
    expect(checkInBRes.body.userId).toBe(ids.users.userB);
    expect(checkInBRes.body.dogId).toBe(ids.dogs.dogB);

    // Get active check-ins for the park
    const activeRes = await request(app)
      .get(`/api/parks/${ids.parks.park3}/check-ins`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(activeRes.status).toBe(200);
    expect(Array.isArray(activeRes.body)).toBe(true);
    expect(activeRes.body.length).toBe(2);

    // Verify both check-ins are present with user and dog details
    const checkInIds = activeRes.body.map((ci: any) => ci.userId);
    expect(checkInIds).toContain(ids.users.userA);
    expect(checkInIds).toContain(ids.users.userB);

    const dogIds = activeRes.body.map((ci: any) => ci.dogId);
    expect(dogIds).toContain(ids.dogs.dogA);
    expect(dogIds).toContain(ids.dogs.dogB);

    // Verify user and dog data is included
    const userACheckIn = activeRes.body.find((ci: any) => ci.userId === ids.users.userA);
    expect(userACheckIn.user).toBeDefined();
    expect(userACheckIn.dog).toBeDefined();
    expect(userACheckIn.user.username).toBe("usera");
    expect(userACheckIn.dog.name).toBe("Rex");

    const userBCheckIn = activeRes.body.find((ci: any) => ci.userId === ids.users.userB);
    expect(userBCheckIn.user).toBeDefined();
    expect(userBCheckIn.dog).toBeDefined();
    expect(userBCheckIn.user.username).toBe("userb");
    expect(userBCheckIn.dog.name).toBe("Luna");
  });

  test("get active check-ins excludes users who checked out", async () => {
    // User A checks in
    await request(app)
      .post(`/api/parks/${ids.parks.park2}/check-in`)
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({ dogId: ids.dogs.dogA });

    // User B checks in
    await request(app)
      .post(`/api/parks/${ids.parks.park2}/check-in`)
      .set("Authorization", `Bearer ${userBToken()}`)
      .send({ dogId: ids.dogs.dogB });

    // User A checks out
    await request(app)
      .post(`/api/parks/${ids.parks.park2}/check-out`)
      .set("Authorization", `Bearer ${userAToken()}`);

    // Get active check-ins
    const activeRes = await request(app)
      .get(`/api/parks/${ids.parks.park2}/check-ins`)
      .set("Authorization", `Bearer ${userBToken()}`);

    expect(activeRes.status).toBe(200);
    expect(activeRes.body.length).toBe(1);
    expect(activeRes.body[0].userId).toBe(ids.users.userB);
    expect(activeRes.body[0].dogId).toBe(ids.dogs.dogB);
    expect(activeRes.body[0].checkedOutAt).toBeNull();
  });
});
