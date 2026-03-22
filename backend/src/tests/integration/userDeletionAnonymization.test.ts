import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../../app";
import { makeToken, ids } from "../fixtures/integrationFixtures";

const prisma = new PrismaClient();

const adminToken = () => makeToken({ id: ids.users.admin, role: "ADMIN" });

describe("user deletion anonymization", () => {
  test("deletes user, removes friendships, and reassigns authored content to deleted_user", async () => {
    const seededComment = await prisma.comment.create({
      data: {
        content: "Test authored post before account deletion",
        userId: ids.users.userA,
        parkId: ids.parks.park1,
      },
      select: { id: true },
    });

    const deleteRes = await request(app)
      .delete(`/users/${ids.users.userA}`)
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(deleteRes.status).toBe(204);

    const deletedUser = await prisma.user.findUnique({
      where: { id: ids.users.userA },
      select: { id: true },
    });
    expect(deletedUser).toBeNull();

    const sentinelUser = await prisma.user.findUnique({
      where: { username: "deleted_user" },
      select: { id: true, username: true, email: true },
    });

    expect(sentinelUser).not.toBeNull();
    expect(sentinelUser?.username).toBe("deleted_user");

    const remainingFriendships = await prisma.friendship.count({
      where: {
        OR: [{ requesterId: ids.users.userA }, { addresseeId: ids.users.userA }],
      },
    });
    expect(remainingFriendships).toBe(0);

    const reassignedComment = await prisma.comment.findUnique({
      where: { id: seededComment.id },
      select: { userId: true },
    });
    expect(reassignedComment?.userId).toBe(sentinelUser?.id);

    const messageOne = await prisma.messages.findUnique({
      where: { id: ids.messages.msg1 },
      select: { senderId: true, receiverId: true },
    });
    expect(messageOne?.senderId).toBe(sentinelUser?.id);

    const messageTwo = await prisma.messages.findUnique({
      where: { id: ids.messages.msg2 },
      select: { senderId: true, receiverId: true },
    });
    expect(messageTwo?.receiverId).toBe(sentinelUser?.id);

    const messageThree = await prisma.messages.findUnique({
      where: { id: ids.messages.msg3 },
      select: { senderId: true, receiverId: true },
    });
    expect(messageThree?.senderId).toBe(sentinelUser?.id);

    const usersListRes = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(usersListRes.status).toBe(200);
    expect(Array.isArray(usersListRes.body)).toBe(true);
    expect(usersListRes.body.some((user: { username?: string }) => user.username === 'deleted_user')).toBe(false);
  });

  test("deletes organizations owned by the deleted user", async () => {
    const ownedOrganization = await prisma.organization.create({
      data: {
        name: `Temp Org ${Date.now()}`,
        ownerId: ids.users.userA,
      },
      select: { id: true },
    });

    const deleteRes = await request(app)
      .delete(`/users/${ids.users.userA}`)
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(deleteRes.status).toBe(204);

    const deletedOrganization = await prisma.organization.findUnique({
      where: { id: ownedOrganization.id },
      select: { id: true },
    });

    expect(deletedOrganization).toBeNull();
  });
});
