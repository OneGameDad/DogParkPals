import request from "supertest";
import path from "path";
import app from "../../app";
import { makeToken, ids } from "../fixtures/integrationFixtures";

const adminToken = () => makeToken({ id: ids.users.admin, role: "ADMIN" });
const userAToken = () => makeToken({ id: ids.users.userA, role: "CLIENT" });
const userBToken = () => makeToken({ id: ids.users.userB, role: "CLIENT" });

describe("auth flows", () => {
  test("login succeeds for seeded admin", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@example.com", password: "password" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.email).toBe("admin@example.com");
    expect(res.body.user).not.toHaveProperty("password_hash");
  });

  test("login fails with wrong password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@example.com", password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("AUTH_ERROR");
  });

  test("login fails for missing user", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "missing@example.com", password: "password" });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  test("logout succeeds with valid token", async () => {
    const res = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send();

    expect(res.status).toBe(204);
  });
});

describe("user flows", () => {
  test("create user succeeds", async () => {
    const res = await request(app)
      .post("/users")
      .send({ username: "newuser", email: "newuser@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("newuser@example.com");
    expect(res.body).not.toHaveProperty("password_hash");
  });

  test("create user rejects duplicate email", async () => {
    const res = await request(app)
      .post("/users")
      .send({ username: "dupe", email: "admin@example.com", password: "password123" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("CONFLICT");
  });

  test("get user by email requires auth", async () => {
    const res = await request(app).get("/users/email/admin@example.com");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("AUTH_ERROR");
  });

  test("get user by email returns sanitized user", async () => {
    const res = await request(app)
      .get("/users/email/admin@example.com")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("admin@example.com");
    expect(res.body).not.toHaveProperty("password_hash");
  });

  test("list users returns array when authorized", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).not.toHaveProperty("password_hash");
  });

  test("presence endpoints require auth", async () => {
    const heartbeatRes = await request(app).post("/users/presence/heartbeat");
    const presenceRes = await request(app).get("/users/presence");

    expect(heartbeatRes.status).toBe(401);
    expect(heartbeatRes.body.code).toBe("AUTH_ERROR");
    expect(presenceRes.status).toBe(401);
    expect(presenceRes.body.code).toBe("AUTH_ERROR");
  });

  test("heartbeat updates presence for current user", async () => {
    const res = await request(app)
      .post("/users/presence/heartbeat")
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(ids.users.userA);
    expect(res.body.lastSeenAt).toBeTruthy();
    expect(typeof res.body.isOnline).toBe("boolean");
    expect(res.body.heartbeatIntervalSeconds).toBe(150);
    expect(res.body.offlineTimeoutSeconds).toBe(300);
  });

  test("get presence returns data for current and specified users", async () => {
    const currentRes = await request(app)
      .get("/users/presence")
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(currentRes.status).toBe(200);
    expect(currentRes.body.userId).toBe(ids.users.userA);
    expect(currentRes.body.lastSeenAt).toBeTruthy();

    const specificRes = await request(app)
      .get(`/users/presence/${ids.users.userB}`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(specificRes.status).toBe(200);
    expect(specificRes.body.userId).toBe(ids.users.userB);
    expect(specificRes.body.lastSeenAt).toBeTruthy();
  });

  test("delete self succeeds", async () => {
    const created = await request(app)
      .post("/users")
      .send({ username: "deleteme", email: "deleteme@example.com", password: "password123" });

    const deleteToken = makeToken({ id: created.body.id, role: "CLIENT" });

    const res = await request(app)
      .delete(`/users/${created.body.id}`)
      .set("Authorization", `Bearer ${deleteToken}`);

    expect(res.status).toBe(204);
  });

  test("delete other user is forbidden", async () => {
    const res = await request(app)
      .delete(`/users/${ids.users.userB}`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  test("change password succeeds", async () => {
    const res = await request(app)
      .post("/users/change-password")
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({ oldPassword: "password", newPassword: "newpassword" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Password changed/i);
  });

  test("change password fails with wrong current password", async () => {
    const res = await request(app)
      .post("/users/change-password")
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({ oldPassword: "wrongpass", newPassword: "anotherpass" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("AUTH_ERROR");
  });

  test("admin can reset another user's password", async () => {
    const res = await request(app)
      .post("/users/reset-password")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ userId: ids.users.userA, newPassword: "resetpass123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Password reset/i);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "usera@example.com", password: "resetpass123" });

    expect(loginRes.status).toBe(200);
  });

  test("non-admin cannot reset passwords", async () => {
    const res = await request(app)
      .post("/users/reset-password")
      .set("Authorization", `Bearer ${userAToken()}`)
      .send({ userId: ids.users.userB, newPassword: "resetpass123" });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });
});

describe("concurrent user operations", () => {
  test("concurrent user creation with same email - only one succeeds", async () => {
    const email = `concurrent-${Date.now()}@example.com`;
    const payload = {
      username: `user${Date.now()}`,
      email,
      password: "password123"
    };

    // Fire two concurrent creation requests with the same email
    const [res1, res2] = await Promise.allSettled([
      request(app).post("/users").send(payload),
      request(app).post("/users").send({ ...payload, username: `user${Date.now()}-2` })
    ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null));

    // One should succeed (201), one should fail (409 conflict)
    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    // The failed one should have unique constraint error code
    const failedRes = res1.status === 409 ? res1 : res2;
    expect(failedRes.status).toBe(409);
    expect(failedRes.body.code).toMatch(/CONFLICT|UNIQUE_CONSTRAINT/);
  });

  test("concurrent user creation with same username - only one succeeds", async () => {
    const username = `concurrentuser-${Date.now()}`;
    const payload = {
      username,
      email: `${Date.now()}-1@example.com`,
      password: "password123"
    };

    const payload2 = {
      username,
      email: `${Date.now()}-2@example.com`,
      password: "password123"
    };

    // Fire two concurrent creation requests with the same username
    const [res1, res2] = await Promise.allSettled([
      request(app).post("/users").send(payload),
      request(app).post("/users").send(payload2)
    ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null));

    // One should succeed (201), one should fail (409 conflict)
    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    // The failed one should have unique constraint error code
    const failedRes = res1.status === 409 ? res1 : res2;
    expect(failedRes.status).toBe(409);
    expect(failedRes.body.code).toMatch(/CONFLICT|UNIQUE_CONSTRAINT/);
  });

  test("new user can login after creation", async () => {
    const newEmail = `new-${Date.now()}@example.com`;
    const newUsername = `newuser${Date.now()}`;

    // Create a new user
    const createRes = await request(app)
      .post("/users")
      .send({ username: newUsername, email: newEmail, password: "password123" });

    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBeDefined();

    // Login with the newly created user
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: newEmail, password: "password123" });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.user.email).toBe(newEmail);
  });

  test("multiple user creations with unique credentials succeed", async () => {
    const user1Email = `seq1-${Date.now()}@example.com`;
    const user2Email = `seq2-${Date.now()}@example.com`;
    const user3Email = `seq3-${Date.now()}@example.com`;

    const create1 = await request(app)
      .post("/users")
      .send({ username: `sequser1${Date.now()}`, email: user1Email, password: "password123" });

    const create2 = await request(app)
      .post("/users")
      .send({ username: `sequser2${Date.now()}`, email: user2Email, password: "password123" });

    const create3 = await request(app)
      .post("/users")
      .send({ username: `sequser3${Date.now()}`, email: user3Email, password: "password123" });

    expect(create1.status).toBe(201);
    expect(create2.status).toBe(201);
    expect(create3.status).toBe(201);

    expect(create1.body.email).toBe(user1Email);
    expect(create2.body.email).toBe(user2Email);
    expect(create3.body.email).toBe(user3Email);
  });

  test("token is required to access authenticated endpoints", async () => {
    // Create a new user
    const newEmail = `tokentest-${Date.now()}@example.com`;
    const newUsername = `tokenuser${Date.now()}`;

    const createRes = await request(app)
      .post("/users")
      .send({ username: newUsername, email: newEmail, password: "password123" });

    expect(createRes.status).toBe(201);

    // Attempt to access authenticated endpoint without token
    const noTokenRes = await request(app).get("/users");

    expect(noTokenRes.status).toBe(401);
    expect(noTokenRes.body.code).toBe("AUTH_ERROR");
  });
});

describe("user profile picture upload", () => {
  test("upload profile picture succeeds with valid token", async () => {
    const fixturePath = path.join(__dirname, "../fixtures/Greg.png");
    const res = await request(app)
      .post("/users/profile-picture")
      .set("Authorization", `Bearer ${userAToken()}`)
      .attach("file", fixturePath);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/uploaded successfully/i);
    expect(res.body.profilePictureUrl).toBeDefined();
    expect(res.body.profilePictureUrl).toMatch(/\/api\/files\/users\//);
  });

  test("upload profile picture fails without auth token", async () => {
    const fixturePath = path.join(__dirname, "../fixtures/Greg.png");
    const res = await request(app)
      .post("/users/profile-picture")
      .attach("file", fixturePath);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("AUTH_ERROR");
  });

  test("upload profile picture fails without file", async () => {
    const res = await request(app)
      .post("/users/profile-picture")
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("NO_FILE_UPLOADED");
  });

  test("get profile picture URL requires auth", async () => {
    const res = await request(app).get(`/api/files/users/${ids.users.userA}/profile-picture`);
    expect(res.status).toBe(401);
  });

  test("user can access own profile picture URL", async () => {
    // Upload first
    const fixturePath = path.join(__dirname, "../fixtures/Greg.png");
    const uploadRes = await request(app)
      .post("/users/profile-picture")
      .set("Authorization", `Bearer ${userAToken()}`)
      .attach("file", fixturePath);

    expect(uploadRes.status).toBe(200);

    // Retrieve the URL
    const res = await request(app)
      .get(`/api/files/users/${ids.users.userA}/profile-picture`)
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.url).toBeDefined();
    expect(res.body.url).toMatch(/\/api\/files\/users\//);
  });

  test("admin can access any user's profile picture URL", async () => {
    // Upload first as userA
    const fixturePath = path.join(__dirname, "../fixtures/Greg.png");
    const uploadRes = await request(app)
      .post("/users/profile-picture")
      .set("Authorization", `Bearer ${userAToken()}`)
      .attach("file", fixturePath);

    expect(uploadRes.status).toBe(200);

    // Admin retrieves userA's profile picture
    const res = await request(app)
      .get(`/api/files/users/${ids.users.userA}/profile-picture`)
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.url).toBeDefined();
  });

  test("non-owner cannot access another user's profile picture URL", async () => {
    // Upload first as userA
    const fixturePath = path.join(__dirname, "../fixtures/Greg.png");
    const uploadRes = await request(app)
      .post("/users/profile-picture")
      .set("Authorization", `Bearer ${userAToken()}`)
      .attach("file", fixturePath);

    expect(uploadRes.status).toBe(200);

    // userB tries to access userA's profile picture
    const res = await request(app)
      .get(`/api/files/users/${ids.users.userA}/profile-picture`)
      .set("Authorization", `Bearer ${userBToken()}`);

    expect(res.status).toBe(403);
  });

  test("delete profile picture succeeds for authenticated user", async () => {
    // Upload first
    const fixturePath = path.join(__dirname, "../fixtures/Greg.png");
    const uploadRes = await request(app)
      .post("/users/profile-picture")
      .set("Authorization", `Bearer ${userAToken()}`)
      .attach("file", fixturePath);

    expect(uploadRes.status).toBe(200);

    // Delete the picture
    const deleteRes = await request(app)
      .delete("/users/profile-picture")
      .set("Authorization", `Bearer ${userAToken()}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toMatch(/deleted successfully/i);
  });

  test("delete profile picture fails without auth", async () => {
    const res = await request(app).delete("/users/profile-picture");

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("AUTH_ERROR");
  });
});
