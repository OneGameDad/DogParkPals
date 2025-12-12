import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Seed minimal data
  const user = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      password_hash: "dev",
      name: "Alice",
    },
  });

  const park = await prisma.park.create({
    data: {
      name: "Central Dog Park",
      location: "City Center",
    },
  });

  await prisma.event.create({
    data: {
      title: "Morning Meetup",
      date: new Date(),
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
