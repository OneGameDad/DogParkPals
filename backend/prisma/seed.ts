import "dotenv/config";
import { PrismaClient, DogBreed, DogPlaystyle, DogSize, EventPrivacy } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed minimal data
  const user = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      password_hash: "dev",
      username: "alice",
      first_name: "Alice",
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
    },
  });

  const park = await prisma.park.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Central Dog Park",
      location: "City Center",
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
