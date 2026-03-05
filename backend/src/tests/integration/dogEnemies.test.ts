import request from "supertest";
import app from "../../app";
import { makeToken, ids } from "../fixtures/integrationFixtures";

const userAToken = () => makeToken({ id: ids.users.userA, role: "CLIENT" });
const userBToken = () => makeToken({ id: ids.users.userB, role: "CLIENT" });

describe("Dog Enemy Flows", () => {
  test("add dog enemy succeeds with valid dog IDs", async () => {
    const res = await request(app)
      .post("/api/dogs/1/enemies")
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({
        ownerDogId: ids.dogs.dogA,
        enemyDogId: ids.dogs.dogC,
      });

    expect(res.status).toBe(201);
    expect(res.body.ownerDogId).toBe(ids.dogs.dogA);
    expect(res.body.enemyDogId).toBe(ids.dogs.dogC);
    expect(res.body.ownerId).toBe(ids.users.userA);
  });

  test("get dog enemies succeeds", async () => {
    const res = await request(app)
      .get(`/api/dogs/${ids.dogs.dogA}/enemies`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // dogA should have at least one enemy (dogB) from fixtures
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty("ownerDogId");
    expect(res.body[0]).toHaveProperty("enemyDogId");
  });

  test("check if dogs are enemies succeeds", async () => {
    const res = await request(app)
      .get(`/api/dogs/${ids.dogs.dogA}/enemies/check/${ids.dogs.dogB}`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("isEnemy");
    expect(typeof res.body.isEnemy).toBe("boolean");
    // dogA and dogB are enemies in fixtures
    expect(res.body.isEnemy).toBe(true);
  });

  test("check if non-enemy dogs returns false", async () => {
    const res = await request(app)
      .get(`/api/dogs/${ids.dogs.dogC}/enemies/check/${ids.dogs.dogA}`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.isEnemy).toBe(false);
  });

  test("remove dog enemy succeeds", async () => {
    // First create an enemy relationship
    const createRes = await request(app)
      .post("/api/dogs/1/enemies")
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({
        ownerDogId: ids.dogs.dogC,
        enemyDogId: ids.dogs.dogA,
      });

    expect(createRes.status).toBe(201);

    // Then remove it
    const removeRes = await request(app)
      .delete("/api/dogs/1/enemies")
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({
        ownerDogId: ids.dogs.dogC,
        enemyDogId: ids.dogs.dogA,
      });

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.message).toBe("Dog enemy removed successfully");
  });

  test("remove non-existent dog enemy returns error", async () => {
    const res = await request(app)
      .delete("/api/dogs/1/enemies")
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({
        ownerDogId: 999,
        enemyDogId: 888,
      });

    expect([400, 404, 500]).toContain(res.status);
  });

  test("add dog enemy requires authentication", async () => {
    const res = await request(app)
      .post("/api/dogs/1/enemies")
      .send({
        ownerDogId: ids.dogs.dogA,
        enemyDogId: ids.dogs.dogC,
      });

    expect(res.status).toBe(401);
  });

  test("get dog enemies requires authentication", async () => {
    const res = await request(app).get(
      `/api/dogs/${ids.dogs.dogA}/enemies`
    );

    expect(res.status).toBe(401);
  });

  test("check dog enemies requires authentication", async () => {
    const res = await request(app).get(
      `/api/dogs/${ids.dogs.dogA}/enemies/check/${ids.dogs.dogB}`
    );

    expect(res.status).toBe(401);
  });

  test("remove dog enemy requires authentication", async () => {
    const res = await request(app)
      .delete("/api/dogs/1/enemies")
      .send({
        ownerDogId: ids.dogs.dogA,
        enemyDogId: ids.dogs.dogC,
      });

    expect(res.status).toBe(401);
  });

  test("add same dog as both owner and enemy returns error", async () => {
    const res = await request(app)
      .post("/api/dogs/1/enemies")
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({
        ownerDogId: ids.dogs.dogA,
        enemyDogId: ids.dogs.dogA,
      });

    expect([400, 422]).toContain(res.status);
  });

  test("duplicate dog enemy relationship returns null", async () => {
    // First create an enemy relationship
    const createRes1 = await request(app)
      .post("/api/dogs/1/enemies")
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({
        ownerDogId: ids.dogs.dogA,
        enemyDogId: ids.dogs.dogC,
      });

    expect(createRes1.status).toBe(201);

    // Try to create the same relationship again
    const createRes2 = await request(app)
      .post("/api/dogs/1/enemies")
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({
        ownerDogId: ids.dogs.dogA,
        enemyDogId: ids.dogs.dogC,
      });

    // Should return null on duplicate
    expect(createRes2.status).toBe(201);
    expect(createRes2.body).toBeNull();
  });
});
