/**
 * Production Database Seeding Script
 * ===================================
 * 
 * This script seeds the production database with initial data:
 * - 5 parks
 * - 5 users (2 admins, 3 developers)
 * - 5 dogs (one per user)
 * 
 * SETUP INSTRUCTIONS:
 * -------------------
 * 
 * 1. PASSWORD SETUP (Important!)
 *    - Passwords must be bcrypt hashed for security
 *    - Generate hashed passwords using Node.js:
 *    
 *      npm install bcryptjs
 *      node -e "require('bcryptjs').hash('your_password', 10, (err, hash) => console.log(hash))"
 *    
 *    - Replace the placeholder hashes in the USERS array with your hashed passwords
 *    - Example: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvQOm
 * 
 * 2. CUSTOMIZE DATA
 *    - Edit the PARKS array for your park locations and details
 *    - Edit the USERS array with your admin/developer credentials
 *    - Edit the DOGS array with dog information
 * 
 * 3. VERIFY DATABASE CONNECTION
 *    - Ensure DATABASE_URL is set in your .env file
 *    - For SQLite: DATABASE_URL="file:./dev.db" or "file:./prod.db"
 *    - For other databases, use appropriate connection string
 * 
 * 4. RUN THE SCRIPT
 *    - From the backend directory:
 *      npx ts-node prisma/seedProduction.ts
 *    
 *    - Or compile and run:
 *      npx tsc prisma/seedProduction.ts
 *      node prisma/seedProduction.js
 * 
 * 5. VERIFY THE SEED
 *    - Check the console output for confirmation messages
 *    - Open Prisma Studio to verify data:
 *      npx prisma studio
 * 
 * NOTES:
 * ------
 * - Parks use upsert to prevent duplicates on re-runs
 * - Users must have unique emails and usernames
 * - Dogs are automatically associated with users via DogOwner records
 * - All timestamps are set automatically (createdAt, updatedAt)
 * - Dog breeds, sizes, and playstyles must match Prisma enums
 */

import "dotenv/config";
import { PrismaClient, DogBreed, DogPlaystyle, DogSize, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

interface ParkData {
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  separateSmallDogArea?: boolean;
  amenities?: string[];
}

interface UserData {
  email: string;
  username: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  latitude?: number;
  longitude?: number;
  role: UserRole;
}

interface OrganizationData {
  name: string;
  description?: string;
  websiteUrl?: string;
  profilePictureUrl?: string;
  ownerIndex: number; // Index of user in USERS array who owns this org
}

interface DogData {
  name: string;
  breed: DogBreed;
  gender: "MALE" | "FEMALE";
  dateOfBirth: Date;
  size?: DogSize;
  playstyle?: DogPlaystyle;
  fixed?: boolean;
  description?: string;
}

// ============================================================================
// CONFIGURATION SECTION
// ============================================================================
// 
// CUSTOMIZE THESE ARRAYS FOR YOUR PRODUCTION ENVIRONMENT
// 
// PARKS Configuration
// -------------------
// Customize park information:
// - name: Display name of the dog park
// - latitude/longitude: GPS coordinates (use Google Maps or similar)
// - description: Brief description of the park
// - separateSmallDogArea: true if park has a separate area for small dogs
// - amenities: Array of available amenities (choose from: 
//   WATER_FOUNTAIN, SHADE, BENCHES, WASTE_BAGS, OBSTACLES, AGILITY_EQUIPMENT)
//
// Example amenity JSON stored in database:
// ["WATER_FOUNTAIN", "BENCHES", "SHADE"]
//

const PARKS: ParkData[] = [
  {
    name: "Central Dog Park",
    latitude: 40.7829,
    longitude: -73.9654,
    description: "A large dog park in the heart of the city",
    separateSmallDogArea: true,
    amenities: ["WATER_FOUNTAIN", "BENCHES", "WASTE_BAGS", "SHADE"],
  },
  {
    name: "Riverside Dog Park",
    latitude: 40.8015,
    longitude: -73.9776,
    description: "Scenic dog park along the river",
    separateSmallDogArea: false,
    amenities: ["WATER_FOUNTAIN", "SHADE", "AGILITY_EQUIPMENT"],
  },
  {
    name: "Forest Grove Dog Park",
    latitude: 40.7614,
    longitude: -73.9776,
    description: "Wooded dog park with natural terrain",
    separateSmallDogArea: true,
    amenities: ["SHADE", "OBSTACLES", "WASTE_BAGS"],
  },
  {
    name: "Sunset Park Dog Area",
    latitude: 40.6432,
    longitude: -74.0314,
    description: "Beautiful dog park with sunset views",
    separateSmallDogArea: false,
    amenities: ["BENCHES", "WATER_FOUNTAIN", "SHADE"],
  },
  {
    name: "Meadow Dog Park",
    latitude: 40.7505,
    longitude: -73.9972,
    description: "Open meadow perfect for running dogs",
    separateSmallDogArea: true,
    amenities: ["WATER_FOUNTAIN", "AGILITY_EQUIPMENT", "OBSTACLES"],
  },
];

// USERS Configuration
// -------------------
// Customize user credentials:
// - email: Must be unique in database; use admin/dev email addresses
// - username: Must be unique; recommend using format: admin_user1, dev_user1, etc.
// - password_hash: BCRYPT HASHED PASSWORD (see setup instructions above)
//   ** DO NOT USE PLAIN TEXT PASSWORDS **
//   Generate with: node -e "require('bcryptjs').hash('password', 10, (err, hash) => console.log(hash))"
// - first_name/last_name: Display names (optional)
// - latitude/longitude: Default location (can be empty or set to main office)
// - role: Must be one of: UserRole.ADMIN, UserRole.DEVELOPER, UserRole.CLIENT
//
// Security Note:
// Never commit plain text passwords to version control.
// Use environment variables or secure credential management for production.
//

const USERS: UserData[] = [
  {
    email: "admin1@dogparkpals.com",
    username: "admin_user1",
    password_hash: "$2b$10$hashedpassword1", // ⚠️ REPLACE WITH ACTUAL HASHED PASSWORD
    first_name: "Admin",
    last_name: "User One",
    latitude: 40.7829,
    longitude: -73.9654,
    role: UserRole.ADMIN,
  },
  {
    email: "admin2@dogparkpals.com",
    username: "admin_user2",
    password_hash: "$2b$10$hashedpassword2", // ⚠️ REPLACE WITH ACTUAL HASHED PASSWORD
    first_name: "Admin",
    last_name: "User Two",
    latitude: 40.8015,
    longitude: -73.9776,
    role: UserRole.ADMIN,
  },
  {
    email: "dev1@dogparkpals.com",
    username: "dev_user1",
    password_hash: "$2b$10$hashedpassword3", // ⚠️ REPLACE WITH ACTUAL HASHED PASSWORD
    first_name: "Developer",
    last_name: "One",
    latitude: 40.7614,
    longitude: -73.9776,
    role: UserRole.DEVELOPER,
  },
  {
    email: "dev2@dogparkpals.com",
    username: "dev_user2",
    password_hash: "$2b$10$hashedpassword4", // ⚠️ REPLACE WITH ACTUAL HASHED PASSWORD
    first_name: "Developer",
    last_name: "Two",
    latitude: 40.6432,
    longitude: -74.0314,
    role: UserRole.DEVELOPER,
  },
  {
    email: "dev3@dogparkpals.com",
    username: "dev_user3",
    password_hash: "$2b$10$hashedpassword5", // ⚠️ REPLACE WITH ACTUAL HASHED PASSWORD
    first_name: "Developer",
    last_name: "Three",
    latitude: 40.7505,
    longitude: -73.9972,
    role: UserRole.DEVELOPER,
  },
];

// ORGANIZATIONS Configuration
// ---------------------------
// Customize organization details:
// - name: Organization name
// - description: Brief description of the organization
// - websiteUrl: Optional website URL
// - profilePictureUrl: Optional logo/profile picture URL
// - ownerIndex: Index of the user in USERS array who will own this organization
//   Example: 0 = admin_user1, 1 = admin_user2, 2 = dev_user1, etc.
//
// Organizations are useful for:
// - Organizing community dog park events
// - Managing group memberships
// - Coordinating park maintenance or activities
//

const ORGANIZATIONS: OrganizationData[] = [
  {
    name: "Friends of Central Dog Park",
    description: "Community group dedicated to improving and maintaining Central Dog Park",
    websiteUrl: "https://friends-central-dogpark.example.com",
    profilePictureUrl: "https://example.com/org1-logo.png",
    ownerIndex: 0, // Owned by admin_user1
  },
  {
    name: "City Dog Parks Alliance",
    description: "City-wide organization promoting responsible dog ownership and park access",
    websiteUrl: "https://city-dog-parks.example.com",
    profilePictureUrl: "https://example.com/org2-logo.png",
    ownerIndex: 1, // Owned by admin_user2
  },
];

// DOGS Configuration
// -------------------
// Customize dog information (one per user, in same order as USERS array):
// - name: Dog's name
// - breed: DogBreed enum value (see schema for all available breeds)
//   Examples: GOLDEN_RETRIEVER, LABRADOR_RETRIEVER, FRENCH_BULLDOG, etc.
// - gender: "MALE" or "FEMALE"
// - dateOfBirth: Dog's date of birth (used to calculate age)
// - size: Optional, must be one of: TOY, SMALL, MEDIUM, LARGE, GIANT, KAIJU
// - playstyle: Optional, must be one of: SOCIAL, SHY, AGGRESSIVE, ENERGETIC, CALM
// - fixed: Optional, boolean (neutered/spayed status)
// - description: Optional, brief description of the dog
//
// IMPORTANT: Dogs array must have same length as USERS array!
// Each dog will be assigned to the user at the same index.
//

const DOGS: DogData[] = [
  {
    name: "Max",
    breed: DogBreed.GOLDEN_RETRIEVER,
    gender: "MALE",
    dateOfBirth: new Date("2022-03-15"),
    size: DogSize.LARGE,
    playstyle: DogPlaystyle.SOCIAL,
    fixed: true,
    description: "Friendly Golden Retriever who loves playing fetch",
  },
  {
    name: "Luna",
    breed: DogBreed.LABRADOR_RETRIEVER,
    gender: "FEMALE",
    dateOfBirth: new Date("2021-07-22"),
    size: DogSize.LARGE,
    playstyle: DogPlaystyle.ENERGETIC,
    fixed: true,
    description: "Energetic Lab who is always ready for action",
  },
  {
    name: "Charlie",
    breed: DogBreed.FRENCH_BULLDOG,
    gender: "MALE",
    dateOfBirth: new Date("2023-01-10"),
    size: DogSize.SMALL,
    playstyle: DogPlaystyle.SHY,
    fixed: false,
    description: "Small French Bulldog, a bit shy but very sweet",
  },
  {
    name: "Bella",
    breed: DogBreed.GERMAN_SHEPHERD,
    gender: "FEMALE",
    dateOfBirth: new Date("2020-11-05"),
    size: DogSize.LARGE,
    playstyle: DogPlaystyle.CALM,
    fixed: true,
    description: "Calm and well-trained German Shepherd",
  },
  {
    name: "Cooper",
    breed: DogBreed.BEAGLE,
    gender: "MALE",
    dateOfBirth: new Date("2022-05-18"),
    size: DogSize.MEDIUM,
    playstyle: DogPlaystyle.SOCIAL,
    fixed: true,
    description: "Friendly Beagle with a nose for adventure",
  },
];

// ============================================================================
// Seeding Function - No changes needed below this line
// ============================================================================

async function seedProduction() {
  try {
    console.log("🌱 Starting production database seed...\n");

    // Seed Parks
    console.log("📍 Creating parks...");
    const createdParks = [];
    for (const parkData of PARKS) {
      const park = await prisma.park.upsert({
        where: { id: createdParks.length + 1 },
        update: {},
        create: {
          ...parkData,
          amenities: parkData.amenities ? JSON.stringify(parkData.amenities) : null,
        },
      });
      createdParks.push(park);
      console.log(`  ✓ Created park: ${park.name} (ID: ${park.id})`);
    }

    // Seed Users
    console.log("\n👥 Creating users...");
    const createdUsers = [];
    for (const userData of USERS) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: { role: userData.role },
        create: userData,
      });
      createdUsers.push(user);
      console.log(
        `  ✓ Created ${userData.role} user: ${user.username} (ID: ${user.id})`
      );
    }

    // Seed Dogs (one per user)
    console.log("\n🐕 Creating dogs and assigning to users...");
    for (let i = 0; i < DOGS.length; i++) {
      const dogData = DOGS[i];
      const owner = createdUsers[i];

      const dog = await prisma.dog.create({
        data: dogData,
      });

      // Create dog ownership
      await prisma.dogOwner.create({
        data: {
          dogId: dog.id,
          userId: owner.id,
          currentOwner: true,
        },
      });

      console.log(
        `  ✓ Created dog: ${dog.name} (ID: ${dog.id}) - Owned by ${owner.username}`
      );
    }

    // Seed Organizations
    console.log("\n🏢 Creating organizations...");
    for (const orgData of ORGANIZATIONS) {
      const owner = createdUsers[orgData.ownerIndex];
      const organization = await prisma.organization.create({
        data: {
          name: orgData.name,
          description: orgData.description,
          websiteUrl: orgData.websiteUrl,
          profilePictureUrl: orgData.profilePictureUrl,
          ownerId: owner.id,
        },
      });

      console.log(
        `  ✓ Created organization: ${organization.name} (ID: ${organization.id}) - Owned by ${owner.username}`
      );
    }

    console.log("\n✅ Production seed completed successfully!\n");
    console.log("Summary:");
    console.log(`  - Parks created: ${PARKS.length}`);
    console.log(`  - Users created: ${USERS.length}`);
    console.log(`  - Dogs created: ${DOGS.length}`);
    console.log(`  - Organizations created: ${ORGANIZATIONS.length}`);
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedProduction();
