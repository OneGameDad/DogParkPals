import request from "supertest";
import app from "../../app";
import { ids, makeToken } from "../fixtures/integrationFixtures";

const adminToken = () => makeToken({ id: ids.users.admin, role: "ADMIN" });
const userAToken = () => makeToken({ id: ids.users.userA, role: "CLIENT" });
const userBToken = () => makeToken({ id: ids.users.userB, role: "CLIENT" });
const userCToken = () => makeToken({ id: ids.users.userC, role: "CLIENT" });

describe("dogs CRUD and ownership", () => {
  test("create dog succeeds", async () => {
    const res = await request(app)
      .post("/api/dogs")
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({
        name: "Zelda",
        breed: "MIXED_BREED",
        gender: "FEMALE",
        dateOfBirth: "2022-01-01T00:00:00.000Z",
        playstyle: "SOCIAL",
        size: "MEDIUM",
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Zelda");
    expect(res.body).toHaveProperty("id");
  });

  test("create dog fails validation", async () => {
    const res = await request(app)
      .post("/api/dogs")
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  test("get dog by id succeeds", async () => {
    const res = await request(app)
      .get(`/api/dogs/${ids.dogs.dogA}`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Rex");
  });

  test("get dog by id not found", async () => {
    const res = await request(app)
      .get("/api/dogs/99999")
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  test("list all dogs", async () => {
    const res = await request(app)
      .get("/api/dogs")
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
  });

  test("list dogs by owner returns owned dogs", async () => {
    const res = await request(app)
      .get(`/api/dogs/owner/${ids.users.userA}`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(200);
    const names = res.body.map((d: any) => d.name).sort();
    expect(names).toEqual(expect.arrayContaining(["Buddy", "Rex"]));
  });

  test("update dog allowed for owner", async () => {
    const res = await request(app)
      .put(`/api/dogs/${ids.dogs.dogA}`)
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({ description: "Updated by owner" });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe("Updated by owner");
  });

  test("update dog forbidden for non-owner", async () => {
    const res = await request(app)
      .put(`/api/dogs/${ids.dogs.dogA}`)
      .set("Authorization", `Bearer ${userCToken()}`)
      .send({ description: "Should not work" });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  test("delete dog allowed for admin", async () => {
    const createRes = await request(app)
      .post("/api/dogs")
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({
        name: "Temp Dog",
        breed: "MIXED_BREED",
        gender: "MALE",
        dateOfBirth: "2022-02-02T00:00:00.000Z",
        playstyle: "CALM",
        size: "SMALL",
      });

    const res = await request(app)
      .delete(`/api/dogs/${createRes.body.id}`)
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(204);
  });

  test("add owner succeeds when friends", async () => {
    const res = await request(app)
      .post(`/api/dogs/${ids.dogs.dogA}/owners`)
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({ userId: ids.users.userB });

    expect(res.status).toBe(204);
  });

  test("add owner forbidden when not friends", async () => {
    const res = await request(app)
      .post(`/api/dogs/${ids.dogs.dogA}/owners`)
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({ userId: ids.users.userC });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  test("remove owner succeeds for owner", async () => {
    const res = await request(app)
      .delete(`/api/dogs/${ids.dogs.dogC}/owners`)
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({ userId: ids.users.userB });

    expect(res.status).toBe(204);
  });

  test("remove owner forbidden for non-owner", async () => {
    const res = await request(app)
      .delete(`/api/dogs/${ids.dogs.dogA}/owners`)
      .set("Authorization", `Bearer ${userCToken()}`)
      .send({ userId: ids.users.userA });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });
});
