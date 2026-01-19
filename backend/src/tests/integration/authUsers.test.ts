import request from "supertest";
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
