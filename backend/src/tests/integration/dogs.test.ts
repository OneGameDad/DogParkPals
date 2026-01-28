import request from "supertest";
import path from "path";
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

  describe("concurrent dog operations", () => {
    test("multiple dogs created concurrently with unique names succeed", async () => {
      const [dog1, dog2, dog3] = await Promise.all([
        request(app)
          .post("/api/dogs")
          .set("Authorization", `Bearer ${userAToken()}`)
          .send({
            name: `ConcurrentDog1-${Date.now()}`,
            breed: "MIXED_BREED",
            gender: "MALE",
            dateOfBirth: "2022-01-01T00:00:00.000Z",
            playstyle: "SOCIAL",
            size: "MEDIUM",
          }),
        request(app)
          .post("/api/dogs")
          .set("Authorization", `Bearer ${userBToken()}`)
          .send({
            name: `ConcurrentDog2-${Date.now()}`,
            breed: "MIXED_BREED",
            gender: "FEMALE",
            dateOfBirth: "2021-06-15T00:00:00.000Z",
            playstyle: "ENERGETIC",
            size: "SMALL",
          }),
        request(app)
          .post("/api/dogs")
          .set("Authorization", `Bearer ${userCToken()}`)
          .send({
            name: `ConcurrentDog3-${Date.now()}`,
            breed: "MIXED_BREED",
            gender: "MALE",
            dateOfBirth: "2023-03-10T00:00:00.000Z",
            playstyle: "CALM",
            size: "LARGE",
          })
      ]);

      expect(dog1.status).toBe(201);
      expect(dog2.status).toBe(201);
      expect(dog3.status).toBe(201);

      // Verify unique dog IDs
      const dogIds = new Set([dog1.body.id, dog2.body.id, dog3.body.id]);
      expect(dogIds.size).toBe(3);
    });

    test("concurrent dog updates succeed independently", async () => {
      // Create two dogs first
      const dogA = await request(app)
        .post("/api/dogs")
        .set("Authorization", `Bearer ${userAToken()}`)
        .send({
          name: `UpdateTest1-${Date.now()}`,
          breed: "MIXED_BREED",
          gender: "MALE",
          dateOfBirth: "2022-01-01T00:00:00.000Z",
          playstyle: "SOCIAL",
          size: "MEDIUM",
        });

      const dogB = await request(app)
        .post("/api/dogs")
        .set("Authorization", `Bearer ${userBToken()}`)
        .send({
          name: `UpdateTest2-${Date.now()}`,
          breed: "MIXED_BREED",
          gender: "FEMALE",
          dateOfBirth: "2021-06-15T00:00:00.000Z",
          playstyle: "ENERGETIC",
          size: "SMALL",
        });

      // Update both concurrently
      const [update1, update2] = await Promise.all([
        request(app)
          .put(`/api/dogs/${dogA.body.id}`)
          .set("Authorization", `Bearer ${adminToken()}`)
          .send({ playstyle: "CALM" }),
        request(app)
          .put(`/api/dogs/${dogB.body.id}`)
          .set("Authorization", `Bearer ${adminToken()}`)
          .send({ playstyle: "AGGRESSIVE" })
      ]);

      expect(update1.status).toBe(200);
      expect(update2.status).toBe(200);
      expect(update1.body.playstyle).toBe("CALM");
      expect(update2.body.playstyle).toBe("AGGRESSIVE");
    });

    test("concurrent dog fetches return consistent data", async () => {
      // Fetch same dog concurrently from multiple users
      const [fetch1, fetch2, fetch3] = await Promise.all([
        request(app)
          .get(`/api/dogs/${ids.dogs.dogA}`)
          .set("Authorization", `Bearer ${userAToken()}`),
        request(app)
          .get(`/api/dogs/${ids.dogs.dogA}`)
          .set("Authorization", `Bearer ${userBToken()}`),
        request(app)
          .get(`/api/dogs/${ids.dogs.dogA}`)
          .set("Authorization", `Bearer ${userCToken()}`)
      ]);

      // All should succeed and return same dog data
      expect(fetch1.status).toBe(200);
      expect(fetch2.status).toBe(200);
      expect(fetch3.status).toBe(200);

      expect(fetch1.body.id).toBe(ids.dogs.dogA);
      expect(fetch2.body.id).toBe(ids.dogs.dogA);
      expect(fetch3.body.id).toBe(ids.dogs.dogA);

      // All should have same name
      expect(fetch1.body.name).toBe(fetch2.body.name);
      expect(fetch2.body.name).toBe(fetch3.body.name);
    });
  });

describe("dog photo upload", () => {
  test("upload dog photo succeeds for dog owner", async () => {
    const fixturePath = path.join(__dirname, "../fixtures/Helga.jpg");
    const res = await request(app)
      .post(`/api/dogs/${ids.dogs.dogA}/photo`)
      .set("Authorization", `Bearer ${userAToken()}`)
      .attach("file", fixturePath);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/uploaded successfully/i);
    expect(res.body.dogPhotoUrl).toBeDefined();
    expect(res.body.dogPhotoUrl).toMatch(/\/api\/files\/dogs\//);
  });

  test("upload dog photo fails for non-owner", async () => {
    const fixturePath = path.join(__dirname, "../fixtures/Helga.jpg");
    const res = await request(app)
      .post(`/api/dogs/${ids.dogs.dogA}/photo`)
      .set("Authorization", `Bearer ${userBToken()}`)
      .attach("file", fixturePath);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  test("upload dog photo fails for missing dog", async () => {
    const fixturePath = path.join(__dirname, "../fixtures/Helga.jpg");
    const res = await request(app)
      .post(`/api/dogs/99999/photo`)
      .set("Authorization", `Bearer ${userAToken()}`)
      .attach("file", fixturePath);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  test("upload dog photo fails without auth", async () => {
    const fixturePath = path.join(__dirname, "../fixtures/Helga.jpg");
    const res = await request(app)
      .post(`/api/dogs/${ids.dogs.dogA}/photo`)
      .attach("file", fixturePath);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("AUTH_ERROR");
  });

  test("upload dog photo fails without file", async () => {
    const res = await request(app)
      .post(`/api/dogs/${ids.dogs.dogA}/photo`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("NO_FILE");
  });

  test("admin can upload dog photo for any dog", async () => {
    const fixturePath = path.join(__dirname, "../fixtures/Helga.jpg");
    const res = await request(app)
      .post(`/api/dogs/${ids.dogs.dogB}/photo`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .attach("file", fixturePath);

    expect(res.status).toBe(200);
    expect(res.body.dogPhotoUrl).toBeDefined();
  });

  test("get dog photo URL requires auth", async () => {
    const res = await request(app).get(`/api/files/dogs/${ids.dogs.dogA}/photo`);
    expect(res.status).toBe(401);
  });

  test("authorized user can get dog photo URL", async () => {
    // Upload first
    const fixturePath = path.join(__dirname, "../fixtures/Helga.jpg");
    const uploadRes = await request(app)
      .post(`/api/dogs/${ids.dogs.dogA}/photo`)
      .set("Authorization", `Bearer ${userAToken()}`)
      .attach("file", fixturePath);

    expect(uploadRes.status).toBe(200);

    // Get the URL
    const res = await request(app)
      .get(`/api/files/dogs/${ids.dogs.dogA}/photo`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.url).toBeDefined();
    expect(res.body.url).toMatch(/\/api\/files\/dogs\//);
  });

  test("dog without photo returns 404 for owner", async () => {
    // dogB is owned by userB, but has no photo uploaded
    const res = await request(app)
      .get(`/api/files/dogs/${ids.dogs.dogB}/photo`)
      .set("Authorization", `Bearer ${userBToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  test("accessing dog without authorization returns 403", async () => {
    // userA tries to access dogB which is owned by userB
    const res = await request(app)
      .get(`/api/files/dogs/${ids.dogs.dogB}/photo`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(403);
  });

  test("delete dog photo succeeds for owner", async () => {
    // Upload first
    const fixturePath = path.join(__dirname, "../fixtures/Helga.jpg");
    const uploadRes = await request(app)
      .post(`/api/dogs/${ids.dogs.dogA}/photo`)
      .set("Authorization", `Bearer ${userAToken()}`)
      .attach("file", fixturePath);

    expect(uploadRes.status).toBe(200);

    // Delete the photo
    const deleteRes = await request(app)
      .delete(`/api/dogs/${ids.dogs.dogA}/photo`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(deleteRes.status).toBe(204);
  });

  test("delete dog photo fails for non-owner", async () => {
    // Upload first as owner
    const fixturePath = path.join(__dirname, "../fixtures/Helga.jpg");
    const uploadRes = await request(app)
      .post(`/api/dogs/${ids.dogs.dogA}/photo`)
      .set("Authorization", `Bearer ${userAToken()}`)
      .attach("file", fixturePath);

    expect(uploadRes.status).toBe(200);

    // Try to delete as non-owner
    const deleteRes = await request(app)
      .delete(`/api/dogs/${ids.dogs.dogA}/photo`)
      .set("Authorization", `Bearer ${userBToken()}`);

    expect(deleteRes.status).toBe(403);
    expect(deleteRes.body.code).toBe("FORBIDDEN");
  });
});
