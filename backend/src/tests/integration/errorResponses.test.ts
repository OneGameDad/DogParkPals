import request from "supertest";
import app from "../../app";
import { ids, makeToken } from "../fixtures/integrationFixtures";

const userAToken = () => makeToken({ id: ids.users.userA, role: "CLIENT" });

describe("error response contract", () => {
  test("auth-required endpoints return standardized 401 body", async () => {
    const requestId = "req-error-401";

    const res = await request(app)
      .get("/api/dogs")
      .set("X-Request-ID", requestId);

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      error: expect.any(String),
      code: "AUTH_ERROR",
      requestId,
    });
    expect(typeof res.body.error).toBe("string");
    expect(res.body.error.length).toBeGreaterThan(0);
    expect(res.body.details).toBeUndefined();
    expect(res.headers["x-request-id"]).toBe(requestId);
  });

  test("forbidden responses include request id and code", async () => {
    const requestId = "req-error-403";

    const res = await request(app)
      .post(`/api/dogs/${ids.dogs.dogA}/owners`)
      .set("Authorization", `Bearer ${userAToken()}`)
      .set("X-Request-ID", requestId)
      .send({ userId: ids.users.userC });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      error: expect.any(String),
      code: "FORBIDDEN",
      requestId,
    });
    expect(res.body.error.length).toBeGreaterThan(0);
    expect(res.body.details).toBeUndefined();
    expect(res.headers["x-request-id"]).toBe(requestId);
  });

  test("validation errors include details map", async () => {
    const requestId = "req-error-400";

    const res = await request(app)
      .post("/api/dogs")
      .set("Authorization", `Bearer ${userAToken()}`)
      .set("X-Request-ID", requestId)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.error).toMatch(/validation failed/i);
    expect(res.body.requestId).toBe(requestId);
    expect(res.headers["x-request-id"]).toBe(requestId);

    const details = res.body.details as Record<string, string[]> | undefined;
    expect(details).toBeDefined();
    const requiredFields = ["name", "breed", "gender", "dateOfBirth", "playstyle", "size"];
    requiredFields.forEach((field) => {
      expect(details?.[field]).toBeDefined();
      expect(Array.isArray(details?.[field])).toBe(true);
      expect(details?.[field]?.length).toBeGreaterThan(0);
      expect(details?.[field]?.every((msg) => typeof msg === "string")).toBe(true);
    });
  });
});
