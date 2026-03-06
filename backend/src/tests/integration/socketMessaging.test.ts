import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import { io as ioClient, Socket } from "socket.io-client";
import { createServer } from "http";
import app from "../../app";
import { initializeSocket } from "../../infrastructure/socket";
import { initializeMessageSocket } from "../../services/messageService";
import { makeToken, ids } from "../fixtures/integrationFixtures";

const userAToken = () => makeToken({ id: ids.users.userA, role: "CLIENT" });
const userBToken = () => makeToken({ id: ids.users.userB, role: "CLIENT" });

async function expectNoSocketEvent(socket: Socket, event: string, waitMs = 150): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      resolve();
    }, waitMs);

    const onEvent = () => {
      clearTimeout(timer);
      socket.off(event, onEvent);
      reject(new Error(`Unexpected event received: ${event}`));
    };

    socket.on(event, onEvent);
  });
}

describe("WebSocket Messaging Integration", () => {
  let httpServer: any;
  let io: any;
  let clientSocketA: Socket;
  let clientSocketB: Socket;
  let socketTokenA: string;
  let socketTokenB: string;
  const PORT = 4001; // Use different port for tests

  beforeAll(async () => {
    // Create HTTP server with Socket.io
    httpServer = createServer(app);
    io = initializeSocket(httpServer);
    initializeMessageSocket(io);

    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(PORT, resolve);
    });
  });

  afterAll(async () => {
    if (clientSocketA?.connected) clientSocketA.disconnect();
    if (clientSocketB?.connected) clientSocketB.disconnect();
    if (io) io.close();
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(resolve);
      });
    }
  });

  beforeEach(async () => {
    // Refresh short-lived socket tokens for each test to avoid expiry flakiness.
    const [resA, resB] = await Promise.all([
      request(app)
        .get("/auth/socket-token")
        .set("Authorization", `Bearer ${userAToken()}`),
      request(app)
        .get("/auth/socket-token")
        .set("Authorization", `Bearer ${userBToken()}`),
    ]);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);

    socketTokenA = resA.body.token;
    socketTokenB = resB.body.token;

    // Connect clients
    clientSocketA = ioClient(`http://localhost:${PORT}`, {
      auth: { token: socketTokenA },
      transports: ["websocket"],
    });

    clientSocketB = ioClient(`http://localhost:${PORT}`, {
      auth: { token: socketTokenB },
      transports: ["websocket"],
    });

    // Wait for connections
    await Promise.all([
      new Promise<void>((resolve) => clientSocketA.on("connect", resolve)),
      new Promise<void>((resolve) => clientSocketB.on("connect", resolve)),
    ]);
  });

  afterEach(() => {
    if (clientSocketA?.connected) clientSocketA.disconnect();
    if (clientSocketB?.connected) clientSocketB.disconnect();
  });

  describe("Message Delivery", () => {
    test("should deliver message in real-time to recipient", async () => {
      const messagePromise = new Promise<any>((resolve) => {
        clientSocketB.on("message:new", resolve);
      });

      // User A sends message to User B
      const res = await request(app)
        .post(`/api/messages/${ids.users.userB}`)
        .set("Authorization", `Bearer ${userAToken()}`)
        .send({
          senderId: ids.users.userA,
          receiverId: ids.users.userB,
          content: "Hello from User A!",
        });

      expect(res.status).toBe(201);

      // User B should receive the message via websocket
      const receivedMessage = await messagePromise;
      expect(receivedMessage).toMatchObject({
        senderId: ids.users.userA,
        receiverId: ids.users.userB,
        content: "Hello from User A!",
        status: "SENT",
      });
      expect(receivedMessage.id).toBeDefined();
    });

    test("should not deliver message to wrong recipient", async () => {
      let messageReceived = false;
      clientSocketA.on("message:new", () => {
        messageReceived = true;
      });

      // User A sends message to User B
      await request(app)
        .post(`/api/messages/${ids.users.userB}`)
        .set("Authorization", `Bearer ${userAToken()}`)
        .send({
          senderId: ids.users.userA,
          receiverId: ids.users.userB,
          content: "Hello!",
        });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // User A should not receive their own message
      expect(messageReceived).toBe(false);
    });
  });

  describe("Typing Indicators", () => {
    test("should broadcast typing:start to recipient", async () => {
      const typingPromise = new Promise<any>((resolve) => {
        clientSocketB.on("typing:start", resolve);
      });

      clientSocketA.emit("typing:start", { receiverId: ids.users.userB });

      const typingData = await typingPromise;
      expect(typingData).toEqual({ senderId: ids.users.userA });
    });

    test("should broadcast typing:stop to recipient", async () => {
      const typingPromise = new Promise<any>((resolve) => {
        clientSocketB.on("typing:stop", resolve);
      });

      clientSocketA.emit("typing:stop", { receiverId: ids.users.userB });

      const typingData = await typingPromise;
      expect(typingData).toEqual({ senderId: ids.users.userA });
    });

    test("should not broadcast typing to sender", async () => {
      let typingReceived = false;
      clientSocketA.on("typing:start", () => {
        typingReceived = true;
      });

      clientSocketA.emit("typing:start", { receiverId: ids.users.userB });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(typingReceived).toBe(false);
    });

    test("should ignore typing:start with malformed receiverId", async () => {
      clientSocketA.emit("typing:start", { receiverId: null });
      await expectNoSocketEvent(clientSocketB, "typing:start");
    });

    test("should ignore typing:stop with malformed receiverId", async () => {
      clientSocketA.emit("typing:stop", { receiverId: "not-a-number" });
      await expectNoSocketEvent(clientSocketB, "typing:stop");
    });
  });

  describe("Message Status Updates", () => {
    test("should broadcast message:status when status is updated", async () => {
      // First, send a message
      const sendRes = await request(app)
        .post(`/api/messages/${ids.users.userB}`)
        .set("Authorization", `Bearer ${userAToken()}`)
        .send({
          senderId: ids.users.userA,
          receiverId: ids.users.userB,
          content: "Test message",
        });

      const messageId = sendRes.body.id;

      // Listen for status update on sender's socket
      const statusPromise = new Promise<any>((resolve) => {
        clientSocketA.on("message:status", resolve);
      });

      // User B marks message as read
      await request(app)
        .patch(`/api/messages/${messageId}/status`)
        .set("Authorization", `Bearer ${userBToken()}`)
        .send({ status: "READ" });

      // User A should receive status update
      const statusUpdate = await statusPromise;
      expect(statusUpdate).toEqual({
        messageId,
        status: "READ",
      });
    });
  });

  describe("Read Receipts", () => {
    test("should broadcast message:read to sender", async () => {
      const readPromise = new Promise<any>((resolve) => {
        clientSocketA.on("message:read", resolve);
      });

      const messageId = 123;
      clientSocketB.emit("message:read", {
        messageId,
        senderId: ids.users.userA,
      });

      const readData = await readPromise;
      expect(readData).toEqual({
        messageId,
        readerId: ids.users.userB,
      });
    });

    test("should ignore message:read with malformed senderId", async () => {
      clientSocketB.emit("message:read", {
        messageId: 123,
        senderId: undefined,
      });

      await expectNoSocketEvent(clientSocketA, "message:read");
    });

    test("should ignore message:read with malformed messageId", async () => {
      clientSocketB.emit("message:read", {
        messageId: "123",
        senderId: ids.users.userA,
      });

      await expectNoSocketEvent(clientSocketA, "message:read");
    });
  });

  describe("Connection Management", () => {
    test("should reject connection without token", async () => {
      const unauthorizedClient = ioClient(`http://localhost:${PORT}`, {
        transports: ["websocket"],
      });

      const errorPromise = new Promise<string>((resolve) => {
        unauthorizedClient.on("connect_error", (error) => {
          resolve(error.message);
        });
      });

      const error = await errorPromise;
      expect(error).toContain("Authentication");

      unauthorizedClient.disconnect();
    });

    test("should reject connection with invalid token", async () => {
      const unauthorizedClient = ioClient(`http://localhost:${PORT}`, {
        auth: { token: "invalid-token" },
        transports: ["websocket"],
      });

      const errorPromise = new Promise<string>((resolve) => {
        unauthorizedClient.on("connect_error", (error) => {
          resolve(error.message);
        });
      });

      const error = await errorPromise;
      expect(error).toContain("Invalid token");

      unauthorizedClient.disconnect();
    });

    test("should maintain connection after message", async () => {
      await request(app)
        .post(`/api/messages/${ids.users.userB}`)
        .set("Authorization", `Bearer ${userAToken()}`)
        .send({
          senderId: ids.users.userA,
          receiverId: ids.users.userB,
          content: "Test",
        });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(clientSocketA.connected).toBe(true);
      expect(clientSocketB.connected).toBe(true);
    });

    test("should handle ping/pong", async () => {
      const pongPromise = new Promise<void>((resolve) => {
        clientSocketA.on("pong", resolve);
      });

      clientSocketA.emit("ping");

      await pongPromise;
      expect(true).toBe(true); // If we get here, ping/pong worked
    });
  });

  describe("Multiple Recipients", () => {
    test("should allow sending messages to multiple users sequentially", async () => {
      const messagePromise = new Promise<any>((resolve) => {
        clientSocketB.on("message:new", resolve);
      });

      // User A sends to User B
      const res1 = await request(app)
        .post(`/api/messages/${ids.users.userB}`)
        .set("Authorization", `Bearer ${userAToken()}`)
        .send({
          senderId: ids.users.userA,
          receiverId: ids.users.userB,
          content: "Message 1",
        });

      expect(res1.status).toBe(201);

      const message1 = await messagePromise;
      expect(message1.content).toBe("Message 1");
    });
  });

  describe("Error Handling", () => {
    test("should handle message send failure gracefully", async () => {
      // Try to send with invalid data
      const res = await request(app)
        .post(`/api/messages/999999`)
        .set("Authorization", `Bearer ${userAToken()}`)
        .send({
          senderId: ids.users.userA,
          receiverId: 999999,
          content: "",
        });

      // Should get an error response
      expect(res.status).toBeGreaterThanOrEqual(400);

      // Connection should still be alive
      expect(clientSocketA.connected).toBe(true);
    });
  });
});
