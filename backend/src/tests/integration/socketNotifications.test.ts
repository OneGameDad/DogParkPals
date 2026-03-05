import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../app";
import { makeToken, ids } from "../fixtures/integrationFixtures";

const userAToken = () => makeToken({ id: ids.users.userA, role: "CLIENT" });
const userBToken = () => makeToken({ id: ids.users.userB, role: "CLIENT" });

describe("Notifications & Auth Integration", () => {
  describe("Socket Token Endpoint", () => {
    test("returns 401 without authentication", async () => {
      const res = await request(app).get("/auth/socket-token");
      expect(res.status).toBe(401);
    });

    test("returns scoped socket token with valid authentication", async () => {
      const res = await request(app)
        .get("/auth/socket-token")
        .set("Authorization", `Bearer ${userAToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(typeof res.body.token).toBe("string");
      expect(res.body.token.length).toBeGreaterThan(0);

      const secret = process.env.JWT_SECRET;
      expect(secret).toBeDefined();

      const decoded = jwt.verify(res.body.token, secret as string, {
        audience: "socket",
      }) as jwt.JwtPayload & { tokenType?: string };

      expect(decoded.tokenType).toBe("socket");
      expect(decoded.userId).toBe(ids.users.userA);
      expect(typeof decoded.exp).toBe("number");
      expect(typeof decoded.iat).toBe("number");
      expect((decoded.exp as number) - (decoded.iat as number)).toBeLessThanOrEqual(120);
    });
  });

  describe("Notification Retrieval", () => {
    test("retrieves notifications for authenticated user", async () => {
      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${userAToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("notifications");
      expect(Array.isArray(res.body.notifications)).toBe(true);
    });

    test("returns 401 without authentication", async () => {
      const res = await request(app).get("/api/notifications");
      expect(res.status).toBe(401);
    });

    test("supports pagination", async () => {
      const res = await request(app)
        .get("/api/notifications?page=1&limit=10")
        .set("Authorization", `Bearer ${userAToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("notifications");
      expect(Array.isArray(res.body.notifications)).toBe(true);
    });

    test("filters unread notifications only", async () => {
      const res = await request(app)
        .get("/api/notifications?unreadOnly=true")
        .set("Authorization", `Bearer ${userAToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("notifications");
      expect(Array.isArray(res.body.notifications)).toBe(true);
    });
  });

  describe("Mark Notification as Read", () => {
    test("returns 401 without authentication", async () => {
      const res = await request(app).post("/api/notifications/1/read");
      expect(res.status).toBe(401);
    });
  });

  describe("Mark All Notifications as Read", () => {
    test("marks all notifications as read", async () => {
      const res = await request(app)
        .patch("/api/notifications/read-all")
        .set("Authorization", `Bearer ${userAToken()}`);

      expect(res.status).toBe(200);
    });

    test("returns 401 without authentication", async () => {
      const res = await request(app).patch("/api/notifications/read-all");
      expect(res.status).toBe(401);
    });
  });

  describe("Notification API Security", () => {
    test("user can access own notifications", async () => {
      const userARes = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${userAToken()}`);

      const userBRes = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${userBToken()}`);

      expect(userARes.status).toBe(200);
      expect(userBRes.status).toBe(200);
    });
  });
});
