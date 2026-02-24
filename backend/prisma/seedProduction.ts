/**
 * Production Database Seeding Script
 * ===================================
 * 
 * This script seeds the production database with initial data:
 * - 5 parks
 * - 5 users (2 admins, 3 developers)
 * - 5 dogs (one per user)
 * - 2 organizations (owned by admins)
 * 
 * SECURITY & SETUP INSTRUCTIONS:
 * ==============================
 * 
 * 1. PASSWORD SETUP (⚠️ CRITICAL!)
 *    - Passwords MUST be bcrypt hashed with cost factor 10
 *    - NEVER use the placeholder hashes in production
 *    - Generate hashes with:
 *      npm install bcryptjs
 *      node -e "require('bcryptjs').hash('your_password', 10, (err, hash) => console.log(hash))"
 *    - Example valid hash: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvQOm
 *    - This script validates all hashes at runtime and REFUSES to run if:
 *      * Any hash matches a placeholder pattern
 *      * Any hash is not a valid bcrypt hash
 *    - Consider using environment variables for production passwords:
 *      ADMIN_USER1_HASH=<bcrypt_hash> npm run seed:prod
 * 
 * 2. CUSTOMIZE DATA
 *    - Edit the PARKS array for your park locations and details
 *    - Edit the USERS array with your admin/developer credentials
 *    - Edit the ORGANIZATIONS array for community groups
 *    - Edit the DOGS array with dog information
 * 
 * 3. VERIFY DATABASE CONNECTION
 *    - Ensure DATABASE_URL is set in your .env file
 *    - For SQLite: DATABASE_URL="file:./prod.db"
 *    - Verify with: npx prisma db execute --stdin < /dev/null
 * 
 * 4. RUN THE SCRIPT
 *    - From the backend directory:
 *      npm run seed:prod  (recommended - uses npm script)
 *      npx ts-node prisma/seedProduction.ts  (direct execution)
 * 
 * 5. VERIFY THE SEED
 *    - Check the console output for confirmation messages
 *    - Open Prisma Studio: npx prisma studio
 *    - Verify organization members were created correctly
 * 
 * DEPLOYMENT NOTES:
 * -----------------
 * - This script is for INITIAL setup only
 * - Do NOT run on subsequent deployments (will update existing data)
 * - devDependencies must be installed to run (includes tsx and bcryptjs)
 * - Script validates all passwords before making any DB changes
 */

import "dotenv/config";
import {
  PrismaClient,
  DogBreed,
  DogPlaystyle,
  DogSize,
  UserRole,
  OrgRole,
  AchievementType,
  NotificationType,
} from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates that a string is a valid bcrypt hash (format: $2a$|$2b$|$2x$|$2y$ followed by cost and salt+hash)
 */
function isValidBcryptHash(hash: string): boolean {
  // Bcrypt hashes are 60 characters long and start with $2a$, $2b$, $2x$, or $2y$
  const bcryptRegex = /^\$2[aby]\$\d{2}\$.{53}$/;
  return bcryptRegex.test(hash);
}

/**
 * Checks if a hash matches the placeholder pattern (indicates it wasn't replaced)
 */
function isPlaceholderHash(hash: string): boolean {
  return /^\$2[aby]\$10\$hashedpassword\d+/i.test(hash);
}

/**
 * Validates all user passwords before seeding
 */
function validateAllPasswords(users: UserData[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  users.forEach((user, index) => {
    if (isPlaceholderHash(user.password_hash)) {
      errors.push(
        `User #${index + 1} (${user.email}): Password hash is still a placeholder. ` +
        `Generate a real bcrypt hash before running this script.`
      );
    } else if (!isValidBcryptHash(user.password_hash)) {
      errors.push(
        `User #${index + 1} (${user.email}): Password hash is not a valid bcrypt hash. ` +
        `Use: node -e "require('bcryptjs').hash('password', 10, (err, hash) => console.log(hash))"`
      );
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Validates array lengths match (DOGS.length === USERS.length)
 */
function validateArrayLengths(
  parks: ParkData[],
  users: UserData[],
  dogs: DogData[],
  orgs: OrganizationData[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (users.length !== dogs.length) {
    errors.push(
      `USERS array (length: ${users.length}) must match DOGS array (length: ${dogs.length}). ` +
      `Each dog is assigned to a user by index.`
    );
  }

  dogs.forEach((dog, index) => {
    if (dog.ownerIndex < 0 || dog.ownerIndex >= users.length) {
      errors.push(
        `Dog #${index + 1} (${dog.name}) ownerIndex (${dog.ownerIndex}) is out of bounds. ` +
        `Valid range: 0-${users.length - 1}`
      );
    }
  });

  for (const org of orgs) {
    if (org.ownerIndex < 0 || org.ownerIndex >= users.length) {
      errors.push(
        `Organization "${org.name}" ownerIndex (${org.ownerIndex}) is out of bounds. ` +
        `Valid range: 0-${users.length - 1}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

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
  ownerIndex: number; // Index of user in USERS array who owns this dog
}

interface AchievementData {
  name: string;
  type: AchievementType;
  badgeUrl?: string;
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
    name: "Råholmens/Rajasaaren Dog Park",
    latitude: 60.18259,
    longitude: 24.90736,
    description: "An island oasis for dogs in the heart of the city",
    separateSmallDogArea: false,
    amenities: ["BENCHES", "SHADE", "BEACH_ACCESS"],
  },
  {
    name: "Lassas/Lassilan Dog Park",
    latitude: 60.23339,
    longitude: 24.87399,
    description: "A spacious dog park with plenty of room to run and play",
    separateSmallDogArea: false,
    amenities: ["WATER_FOUNTAIN", "SHADE", "BENCHES"],
  },
  {
    name: "Nybondas/Kanavan Dog Park",
    latitude: 60.20896,
    longitude: 25.16210,
    description: "Wooded dog park with natural terrain",
    separateSmallDogArea: true,
    amenities: ["SHADE", "WASTE_BAGS", "BENCHES"],
  },
  {
    name: "Drumsö/Lauttasaari Dog Park",
    latitude: 60.14696,
    longitude: 24.89234,
    description: "Beautiful dog park with sunset views",
    separateSmallDogArea: false,
    amenities: ["BENCHES", "WATER_FOUNTAIN", "BEACH_ACCESS", "SHADE"],
  },
  {
    name: "Blåbärslandet/Mustikkamaa Dog Park",
    latitude: 60.18402,
    longitude: 24.98426,
    description: "Lots of blueberries (when in season) and a separate small dog area",
    separateSmallDogArea: true,
    amenities: ["WATER_FOUNTAIN", "AGILITY_EQUIPMENT", "OBSTACLES", "SHADE"],
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
    first_name: "Greg",
    last_name: "Pellechi",
    role: UserRole.ADMIN,
  },
  {
    email: "admin2@dogparkpals.com",
    username: "admin_user2",
    password_hash: "$2b$10$hashedpassword2", // ⚠️ REPLACE WITH ACTUAL HASHED PASSWORD
    first_name: "Renato",
    last_name: "de Moraes Bonilha",
    role: UserRole.ADMIN,
  },
  {
    email: "dev1@dogparkpals.com",
    username: "dev_user1",
    password_hash: "$2b$10$hashedpassword3", // ⚠️ REPLACE WITH ACTUAL HASHED PASSWORD
    first_name: "Laura",
    last_name: "Guillen",
    role: UserRole.DEVELOPER,
  },
  {
    email: "dev2@dogparkpals.com",
    username: "dev_user2",
    password_hash: "$2b$10$hashedpassword4", // ⚠️ REPLACE WITH ACTUAL HASHED PASSWORD
    first_name: "Jules",
    last_name: "Pierce",
    role: UserRole.DEVELOPER,
  },
  {
    email: "dev3@dogparkpals.com",
    username: "dev_user3",
    password_hash: "$2b$10$hashedpassword5", // ⚠️ REPLACE WITH ACTUAL HASHED PASSWORD
    first_name: "Mark",
    last_name: "Byrne",
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
    name: "Doggis",
    description: "Dog Daycare and Training Center in Swedish (Finland)",
    websiteUrl: "https://friends-central-dogpark.example.com",
    profilePictureUrl: "https://example.com/org1-logo.png",
    ownerIndex: 0, // Owned by admin_user1
  },
  {
    name: "Beagle Brigade",
    description: "Helsinki's Premier Beagle Meetup Group",
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
    name: "Helga",
    breed: DogBreed.BARBET,
    gender: "FEMALE",
    dateOfBirth: new Date("2022-03-15"),
    size: DogSize.MEDIUM,
    playstyle: DogPlaystyle.SOCIAL,
    fixed: true,
    description: "Friendly Barbet who loves playing with other dogs",
    ownerIndex: 0,
  },
  {
    name: "Luna",
    breed: DogBreed.BASSET_HOUND,
    gender: "FEMALE",
    dateOfBirth: new Date("2021-07-22"),
    size: DogSize.MEDIUM,
    playstyle: DogPlaystyle.CALM,
    fixed: true,
    description: "Calm Basset Hound who enjoys lounging in the shade",
    ownerIndex: 1,
  },
  {
    name: "Merri",
    breed: DogBreed.CIRNECO_DELL_ETNA,
    gender: "FEMALE",
    dateOfBirth: new Date("2023-01-10"),
    size: DogSize.SMALL,
    playstyle: DogPlaystyle.SHY,
    fixed: false,
    description: "Small Cirneco dell'Etna, a bit shy but very sweet",
    ownerIndex: 2,
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
    ownerIndex: 3,
  },
  {
    name: "Cooper",
    breed: DogBreed.FINNISH_LAPPHUND,
    gender: "MALE",
    dateOfBirth: new Date("2022-05-18"),
    size: DogSize.MEDIUM,
    playstyle: DogPlaystyle.SOCIAL,
    fixed: true,
    description: "Friendly Finnish Lapphund with a nose for adventure",
    ownerIndex: 4,
  },
];

const ACHIEVEMENTS: AchievementData[] = [
  {
    name: "Level 2",
    type: AchievementType.TROPHY,
    badgeUrl: "/trophies/trophy_level_2.png",
  },
  {
    name: "Level 3",
    type: AchievementType.TROPHY,
    badgeUrl: "/trophies/trophy_level_3.png",
  },
  {
    name: "Level 4",
    type: AchievementType.TROPHY,
    badgeUrl: "/trophies/trophy_level_4.png",
  },
  {
    name: "Level 5",
    type: AchievementType.TROPHY,
    badgeUrl: "/trophies/trophy_level_5.png",
  },
  {
    name: "Best Friend",
    type: AchievementType.BADGE,
    badgeUrl: "/badges/badge_best_friend.png",
  },
  {
    name: "Okay Friend",
    type: AchievementType.BADGE,
    badgeUrl: "/badges/badge_okay_friend.png",
  },
  {
    name: "Pack Leader",
    type: AchievementType.BADGE,
    badgeUrl: "/badges/badge_pack_leader.png",
  },
  {
    name: "Pack Member",
    type: AchievementType.BADGE,
    badgeUrl: "/badges/badge_pack_member.png",
  },
  {
    name: "Pup Pal",
    type: AchievementType.BADGE,
    badgeUrl: "/badges/badge_pup_pal.png",
  },
  {
    name: "Park Patrol",
    type: AchievementType.BADGE,
    badgeUrl: "/badges/badge_park_patrol.png",
  },
  {
    name: "Family Dog",
    type: AchievementType.BADGE,
    badgeUrl: "/badges/badge_family_dog.png",
  },
  {
    name: "Sir Barks-A-Lot",
    type: AchievementType.BADGE,
    badgeUrl: "/badges/badge_Sir_Barks_A_Lot.png",
  },
  {
    name: "Fought The Post Man",
    type: AchievementType.BADGE,
    badgeUrl: "/badges/badge_fought_the_post_man.png",
  },
];

// ============================================================================
// Seeding Function - No changes needed below this line
// ============================================================================

async function seedProduction() {
  try {
    console.log("🌱 Starting production database seed...\n");

    // ========== VALIDATION PHASE ==========
    console.log("✓ Validating configuration...");
    
    // Check array lengths
    const lengthValidation = validateArrayLengths(PARKS, USERS, DOGS, ORGANIZATIONS);
    if (!lengthValidation.valid) {
      throw new Error(
        "Configuration validation failed:\n" + lengthValidation.errors.join("\n")
      );
    }

    // Check password hashes
    const passwordValidation = validateAllPasswords(USERS);
    if (!passwordValidation.valid) {
      throw new Error(
        "Password validation failed - refusing to seed:\n" + passwordValidation.errors.join("\n")
      );
    }
    console.log("  ✓ All passwords are valid bcrypt hashes\n");

    // ========== SEEDING PHASE ========== 

    // Seed Parks
    console.log("📍 Creating parks...");
    const createdParks = [];
    for (const parkData of PARKS) {
      // Use park name as stable unique key for upsert (add unique constraint to schema if not present)
      // For now, upsert by name to make seeding idempotent
      const park = await prisma.park.upsert({
        where: { name: parkData.name },
        update: {
          latitude: parkData.latitude,
          longitude: parkData.longitude,
          description: parkData.description,
          separateSmallDogArea: parkData.separateSmallDogArea,
          amenities: parkData.amenities ? parkData.amenities : null, // Store as JSON array, not string
        },
        create: {
          ...parkData,
          amenities: parkData.amenities ? parkData.amenities : null, // Store as JSON array, not string
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
    const createdDogs = [];
    for (let i = 0; i < DOGS.length; i++) {
      const dogData = DOGS[i];
      const owner = createdUsers[dogData.ownerIndex];
      const { ownerIndex, ...dogCreateData } = dogData;

      const dog = await prisma.dog.create({
        data: dogCreateData,
      });
      createdDogs.push(dog);

      // Create dog ownership record (upsert by composite key)
      await prisma.dogOwner.upsert({
        where: {
          userId_dogId: {
            userId: owner.id,
            dogId: dog.id,
          },
        },
        update: {}, // No updates needed
        create: {
          userId: owner.id,
          dogId: dog.id,
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
      
      // Upsert organization by name to make idempotent
      const organization = await prisma.organization.upsert({
        where: { name: orgData.name },
        update: {
          description: orgData.description,
          websiteUrl: orgData.websiteUrl,
          profilePictureUrl: orgData.profilePictureUrl,
          ownerId: owner.id,
        },
        create: {
          name: orgData.name,
          description: orgData.description,
          websiteUrl: orgData.websiteUrl,
          profilePictureUrl: orgData.profilePictureUrl,
          ownerId: owner.id,
        },
      });

      // Create/update OrganizationMember record for the owner with OWNER role
      // This is required because authorization logic checks OrganizationMember, not just ownerId
      await prisma.organizationMember.upsert({
        where: {
          userId_organizationId: {
            userId: owner.id,
            organizationId: organization.id,
          },
        },
        update: {
          role: OrgRole.OWNER,
        },
        create: {
          userId: owner.id,
          organizationId: organization.id,
          role: OrgRole.OWNER,
        },
      });

      console.log(
        `  ✓ Created organization: ${organization.name} (ID: ${organization.id}) - Owned by ${owner.username}`
      );
    }

    console.log("\n🏆 Creating achievements...");
    let createdAchievements = 0;
    for (const achievement of ACHIEVEMENTS) {
      const existingAchievement = await prisma.achievements.findFirst({
        where: {
          name: achievement.name,
          type: achievement.type,
        },
      });

      if (!existingAchievement) {
        await prisma.achievements.create({ data: achievement });
        createdAchievements += 1;
        console.log(`  ✓ Created achievement: ${achievement.name} (${achievement.type})`);
      } else {
        console.log(`  ↺ Achievement exists: ${achievement.name} (${achievement.type})`);
      }
    }

    console.log("\n🔔 Creating sample notifications...");
    const primaryUser = createdUsers[0];
    const secondaryUser = createdUsers[1];
    const primaryDog = createdDogs[0];
    const primaryPark = createdParks[0];

    if (primaryUser && primaryDog && primaryPark) {
      await prisma.notification.createMany({
        data: [
          {
            userId: primaryUser.id,
            type: NotificationType.DOG_CREATED,
            payload: { dogId: primaryDog.id, name: primaryDog.name },
          },
          {
            userId: primaryUser.id,
            type: NotificationType.USER_PHOTO_UPLOADED,
            payload: { profilePictureUrl: "https://example.com/seed-user.jpg" },
          },
          {
            userId: primaryUser.id,
            type: NotificationType.PARK_DELETED,
            payload: { parkId: primaryPark.id, name: primaryPark.name },
          },
        ],
      });
    }

    if (secondaryUser && primaryDog) {
      await prisma.notification.createMany({
        data: [
          {
            userId: secondaryUser.id,
            type: NotificationType.DOG_PHOTO_REMOVED,
            payload: { dogId: primaryDog.id },
          },
          {
            userId: secondaryUser.id,
            type: NotificationType.FRIEND_REMOVED,
            payload: { userId: secondaryUser.id, friendId: primaryUser?.id },
          },
        ],
      });
    }

    console.log("\n✅ Production seed completed successfully!\n");
    console.log("Summary:");
    console.log(`  - Parks created/updated: ${PARKS.length}`);
    console.log(`  - Users created: ${USERS.length}`);
    console.log(`  - Dogs created: ${DOGS.length}`);
    console.log(`  - Organizations created/updated: ${ORGANIZATIONS.length}`);
    console.log(`  - Achievements created: ${createdAchievements}`);
    console.log("\n⚠️  Remember: Only run this script during initial setup, not on subsequent deployments.");
  } catch (error) {
    console.error("\n❌ Error during seeding:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function and handle any unhandled rejections
seedProduction().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
