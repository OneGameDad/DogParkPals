import "dotenv/config";
import { PrismaClient, DogBreed, DogPlaystyle, DogSize, EventPrivacy, OrgRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  // Seed minimal data
  const user = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      password_hash: "dev",
      username: "alice",
      first_name: "Alice",
      lastSeenAt: twoMinutesAgo,
    },
  });

  const userBob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      password_hash: "dev",
      username: "bob",
      first_name: "Bob",
      lastSeenAt: tenMinutesAgo,
    },
  });

  const park = await prisma.park.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Central Dog Park",
      latitude: 40.7829,
      longitude: -73.9654,
    },
  });

  // Organizations
  const org1 = await prisma.organization.create({
    data: {
      name: "Friends of Central Dog Park",
      description: "Community group organizing dog-friendly events.",
      ownerId: user.id,
      websiteUrl: "https://central-dog-park.example.com",
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      name: "Dogs United NYC",
      description: "Non-profit promoting responsible dog ownership.",
      ownerId: userBob.id,
    },
  });

  const dog = await prisma.dog.create({
    data: {
      name: "Rex",
      breed: DogBreed.LABRADOR_RETRIEVER,
      gender: "MALE",
      dateOfBirth: new Date("2020-06-01"),
      playstyle: DogPlaystyle.SOCIAL,
      size: DogSize.MEDIUM,
    },
  });

  // Many-to-many: owners for dog
  await prisma.dogOwner.upsert({
    where: { userId_dogId: { userId: user.id, dogId: dog.id } },
    update: {},
    create: { userId: user.id, dogId: dog.id },
  });
  await prisma.dogOwner.upsert({
    where: { userId_dogId: { userId: userBob.id, dogId: dog.id } },
    update: {},
    create: { userId: userBob.id, dogId: dog.id },
  });

  // Many-to-many: user favorites park
  await prisma.userFavoritePark.upsert({
    where: { userId_parkId: { userId: user.id, parkId: park.id } },
    update: {},
    create: { userId: user.id, parkId: park.id },
  });

  // Organization memberships
  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org1.id } },
    update: { role: OrgRole.OWNER },
    create: { userId: user.id, organizationId: org1.id, role: OrgRole.OWNER },
  });

  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: userBob.id, organizationId: org1.id } },
    update: { role: OrgRole.MEMBER },
    create: { userId: userBob.id, organizationId: org1.id, role: OrgRole.MEMBER },
  });

  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: userBob.id, organizationId: org2.id } },
    update: { role: OrgRole.OWNER },
    create: { userId: userBob.id, organizationId: org2.id, role: OrgRole.OWNER },
  });

  await prisma.event.create({
    data: {
      title: "Morning Meetup",
      date: new Date(),
      startTime: new Date(new Date().setHours(9, 0, 0, 0)),
      endTime: new Date(new Date().setHours(11, 0, 0, 0)),
      description: "A fun morning meetup for dogs and their owners.",
      private: EventPrivacy.PUBLIC,
      park: { connect: { id: park.id } },
      organizer: { connect: { id: user.id } },
    },
  });

  // Event associated to organization
  const charityWalk = await prisma.event.create({
    data: {
      title: "Weekend Charity Walk",
      date: new Date(new Date().setDate(new Date().getDate() + 7)),
      startTime: new Date(new Date().setHours(10, 0, 0, 0)),
      endTime: new Date(new Date().setHours(12, 0, 0, 0)),
      description: "Join us for a charity walk organized by Friends of Central Dog Park.",
      private: EventPrivacy.PUBLIC,
      park: { connect: { id: park.id } },
      organizer: { connect: { id: userBob.id } },
      organization: { connect: { id: org1.id } },
    },
  });

  // Attendance records
  await prisma.eventAttendance.upsert({
    where: { userId_eventId: { userId: user.id, eventId: charityWalk.id } },
    update: {},
    create: { userId: user.id, eventId: charityWalk.id },
  });

  await prisma.eventAttendance.upsert({
    where: { userId_eventId: { userId: userBob.id, eventId: charityWalk.id } },
    update: {},
    create: { userId: userBob.id, eventId: charityWalk.id },
  });

  // Friendships (user-to-user only)
  await prisma.friendship.create({
    data: {
      requesterId: user.id,
      addresseeId: userBob.id,
      status: "ACCEPTED",
    },
  });

  // Messages between users
  await prisma.messages.create({
    data: {
      senderId: user.id,
      receiverId: userBob.id,
      content: "Hey Bob! Are you bringing Rex to the park today?",
      status: "READ",
    },
  });

  await prisma.messages.create({
    data: {
      senderId: userBob.id,
      receiverId: user.id,
      content: "Hi Alice! Yes, planning to be there around 10 AM. See you then!",
      status: "READ",
    },
  });

  await prisma.messages.create({
    data: {
      senderId: user.id,
      receiverId: userBob.id,
      content: "Perfect! Rex and my pups will have a great time.",
      status: "DELIVERED",
    },
  });

  // Check-ins at parks
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Alice checked in with Rex (still there)
  await prisma.checkIn.create({
    data: {
      userId: user.id,
      dogId: dog.id,
      parkId: park.id,
      checkedInAt: twoHoursAgo,
    },
  });

  // Bob checked in (without a dog)
  await prisma.checkIn.create({
    data: {
      userId: userBob.id,
      parkId: park.id,
      checkedInAt: oneHourAgo,
    },
  });

  // Alice checked out earlier (historical check-in)
  await prisma.checkIn.create({
    data: {
      userId: user.id,
      dogId: dog.id,
      parkId: park.id,
      checkedInAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      checkedOutAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
  });

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
