# Production Database Seeding Guide

Complete guide for seeding the production database. Start at the section that matches your needs:
- **Quick start?** → Jump to [Quick Start (5 minutes)](#quick-start-5-minutes)
- **Need setup details?** → Start at [Step-by-Step Setup](#step-by-step-setup)
- **Going to production?** → Use [Pre-Production Checklist](#pre-production-checklist)
- **Seeing errors?** → Check [Troubleshooting](#troubleshooting-common-issues)

---

## Quick Start (5 minutes)

### Step 1: Generate Password Hashes (2 min)

```bash
npm install bcryptjs

# Generate 5 hashes - replace passwords with your actual ones
node -e "require('bcryptjs').hash('admin1password', 10, (err, hash) => console.log('ADMIN 1:', hash))"
node -e "require('bcryptjs').hash('admin2password', 10, (err, hash) => console.log('ADMIN 2:', hash))"
node -e "require('bcryptjs').hash('dev1password', 10, (err, hash) => console.log('DEV 1:', hash))"
node -e "require('bcryptjs').hash('dev2password', 10, (err, hash) => console.log('DEV 2:', hash))"
node -e "require('bcryptjs').hash('dev3password', 10, (err, hash) => console.log('DEV 3:', hash))"

# Save these 5 hashes somewhere safe!
```

### Step 2: Update seedProduction.ts (2 min)

Open `backend/prisma/seedProduction.ts`:
1. `PARKS` array → Update with your park names & coordinates
2. `USERS` array → Replace password_hash values with generated hashes
3. `ORGANIZATIONS` array → Update names and descriptions
4. `DOGS` array → Update with your dog information

### Step 3: Run the Seed (1 min)

```bash
cd backend
npm install              # Install dependencies (including devDeps)
npm run migrate         # Apply database migrations
npm run seed:prod       # Run the seeding script
```

### Verify It Worked

```bash
npx prisma studio      # Open visual database editor
# Check: 5 parks, 5 users, 5 dogs, 2 organizations
```

---

## Step-by-Step Setup

### Database Provider Notice

**This repository uses SQLite** as configured in `prisma/schema.prisma`. 

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

If you need PostgreSQL or MySQL instead:
1. Change `provider` in `prisma/schema.prisma`
2. Update your `DATABASE_URL` environment variable
3. Run `npx prisma migrate reset --force` to recreate migrations
4. Follow the new provider's connection string format

This guide assumes **SQLite**. Adjust database paths and commands accordingly if using PostgreSQL/MySQL.

## Production-Ready Checklist

Before deploying to production, ensure:

- [ ] **Database created and accessible** (PostgreSQL/MySQL/SQLite)
- [ ] **DATABASE_URL** environment variable set
- [ ] **Prisma migrations applied**: `npm run migrate`
- [ ] **bcryptjs installed** (for password hash generation)
- [ ] **All user passwords hashed** with bcryptjs
- [ ] **Parks and dog data customized** in seedProduction.ts
- [ ] **Seed script tested** on staging database first
- [ ] **Database backups taken** before seeding
- [ ] **Credentials documented securely** (password manager, not git)

## Overview

The seeding script creates:
- **5 Dog Parks** with locations and amenities
- **5 Users** (2 admins + 3 developers) with proper authentication
- **5 Dogs** (one per user) with breed and personality info
- **2 Organizations** (community groups run by admins)

### Important: devDependencies Must Be Installed

The `npm run seed:prod` script uses `tsx` (TypeScript executor), which is a **devDependency**. 

When deploying:
```bash
# ✅ Install WITH devDependencies (allows seeding)
npm install

# ❌ DON'T omit devDependencies if you need to seed
npm install --production  # This will fail because tsx isn't available
```

**For initial production setup:** Install with devDependencies, run seeding, then optionally deploy a slim production image without them.

**For subsequent deployments:** Don't run seeding again—just run migrations and start the server.
   ```bash
   node --version
   npm --version
   ```

2. **Dependencies installed**
   ```bash
   cd backend
   npm install
   ```

3. **Database configured**
   - Ensure `DATABASE_URL` is set in `.env` file
   - Example for SQLite: `DATABASE_URL="file:./prod.db"`
   - Example for PostgreSQL: `DATABASE_URL="postgresql://user:password@localhost:5432/dogparkpals"`

4. **Prisma migrations applied**
   ```bash
   npx prisma migrate deploy
   ```

## Step-by-Step Setup

### Step 1: Generate Bcrypt Password Hashes

Passwords must be bcrypt hashed for security. Never use plain text passwords in production.

**Generate a hashed password:**

```bash
# Install bcryptjs if you don't have it
npm install bcryptjs

# Generate a hash (replaces 'mypassword' with your actual password)
node -e "require('bcryptjs').hash('mypassword', 10, (err, hash) => console.log(hash))"
```

This will output something like:
```
$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvQOm
```

**Generate hashes for all 5 users** and keep them safe.

### Step 2: Update User Passwords

Open [prisma/seedProduction.ts](seedProduction.ts) and replace the placeholder password hashes:

```typescript
const USERS: UserData[] = [
  {
    email: "admin1@dogparkpals.com",
    username: "admin_user1",
    password_hash: "$2b$10$YOUR_GENERATED_HASH_HERE", // ⚠️ Replace this!
    // ... rest of user data
  },
  // ... repeat for all 5 users
];
```

**Password Hash Validation:**
The script validates ALL passwords before seeding and will REFUSE to run if:
- Any password hash matches a placeholder pattern (`$2b$10$hashedpassword*`)
- Any password hash is not a valid bcrypt hash (60 characters, starting with `$2a$`, `$2b$`, `$2x$`, or `$2y$`)

This prevents accidentally seeding production with invalid or demo credentials.

**If validation fails:** You'll see a clear error like:
```
Password validation failed - refusing to seed:
User #1 (admin1@dogparkpals.com): Password hash is still a placeholder.
```

Generate proper hashes and try again.

### Step 3: Customize Organizations

Edit the `ORGANIZATIONS` array in [seedProduction.ts](seedProduction.ts):

**Configuration Options:**
- `name` - Organization name
- `description` - Purpose and details
- `websiteUrl` - Optional website link
- `profilePictureUrl` - Optional logo URL
- `ownerIndex` - Which user owns it (0=admin_user1, 1=admin_user2, 2=dev_user1, etc.)

**What Organizations Do:**
- Host and organize dog park events
- Manage member groups
- Coordinate park improvement activities
- Community engagement and communication

**Example:**
```typescript
const ORGANIZATIONS: OrganizationData[] = [
  {
    name: "Friends of Central Dog Park",
    description: "Community group dedicated to improving Central Dog Park",
    websiteUrl: "https://friends-central-dogpark.example.com",
    profilePictureUrl: "https://example.com/org1-logo.png",
    ownerIndex: 0, // Owned by admin_user1
  },
  {
    name: "City Dog Parks Alliance",
    description: "City-wide organization promoting responsible dog ownership",
    websiteUrl: "https://city-dog-parks.example.com",
    profilePictureUrl: "https://example.com/org2-logo.png",
    ownerIndex: 1, // Owned by admin_user2
  },
];
```

### Step 4: Customize Park Details

Edit the `PARKS` array in [seedProduction.ts](seedProduction.ts):

**Example:**
```typescript
const PARKS: ParkData[] = [
  {
    name: "Central Dog Park",
    latitude: 40.7829,        // Your park's latitude
    longitude: -73.9654,      // Your park's longitude
    description: "A large dog park in the heart of the city",
    separateSmallDogArea: true,
    amenities: ["WATER_FOUNTAIN", "BENCHES", "WASTE_BAGS", "SHADE"],
  },
  // ... add 4 more parks
];
```

**How to find coordinates:**
- Use [Google Maps](https://maps.google.com)
- Right-click on location → coordinates appear at top
- Format: latitude, longitude (both are decimal numbers)

**Park Names Must Be Unique:**
Parks are upserted by name, so each park must have a unique name. Re-running the script will update existing parks with matching names (rather than creating duplicates).

**Amenities Format:**
Amenities are stored as JSON array in the database, not as a string. Always use an array:
```typescript
// ✅ Correct
amenities: ["WATER_FOUNTAIN", "BENCHES", "SHADE"]

// ❌ Wrong (don't stringify)
amenities: JSON.stringify(["WATER_FOUNTAIN"])
```

**Available Amenities:**
- `WATER_FOUNTAIN` - Drinking water available
- `SHADE` - Trees or covers for shade
- `BENCHES` - Seating for owners
- `WASTE_BAGS` - Poop bag dispensers
- `OBSTACLES` - Natural obstacles for playing
- `AGILITY_EQUIPMENT` - Formal training equipment

### Step 5: Customize User Details

Edit the `USERS` array:

```typescript
const USERS: UserData[] = [
  {
    email: "admin1@dogparkpals.com",        // Change to your admin email
    username: "admin_user1",                 // Change to desired username
    password_hash: "YOUR_BCRYPT_HASH",       // Replace with generated hash
    first_name: "Admin",                     // Admin's first name
    last_name: "User One",                   // Admin's last name
    latitude: 40.7829,                       // Default location (optional)
    longitude: -73.9654,                     // Default location (optional)
    role: UserRole.ADMIN,                    // Keep as ADMIN
  },
  // ... repeat pattern for others
];
```

**Note:** Roles must be:
- `UserRole.ADMIN` (for admins)
- `UserRole.DEVELOPER` (for developers)
- `UserRole.CLIENT` (for regular users - not recommended for seed)

### Step 6: Customize Dog Details

Edit the `DOGS` array. **IMPORTANT: Dogs array must have same length as USERS array!**

```typescript
const DOGS: DogData[] = [
  {
    name: "Max",
    breed: DogBreed.GOLDEN_RETRIEVER,  // Must match DogBreed enum
    gender: "MALE",                     // "MALE" or "FEMALE"
    dateOfBirth: new Date("2022-03-15"),
    size: DogSize.LARGE,                // TOY, SMALL, MEDIUM, LARGE, GIANT, KAIJU
    playstyle: DogPlaystyle.SOCIAL,     // SOCIAL, SHY, AGGRESSIVE, ENERGETIC, CALM
    fixed: true,                        // Neutered/spayed?
    description: "Friendly Golden Retriever who loves playing fetch",
  },
  // ... repeat for all 5 dogs
];
```

**Available Dog Breeds** (sample list):
- `GOLDEN_RETRIEVER`
- `LABRADOR_RETRIEVER`
- `FRENCH_BULLDOG`
- `GERMAN_SHEPHERD`
- `BEAGLE`
- `MIXED_BREED`
- `UNKNOWN`
- (See schema.prisma for complete list)

## Running the Seed Script

### From the Backend Directory:

```bash
cd backend

# Option 1: Run migrations first, then seed (recommended)
npm run setup:prod

# Option 2: Run each step separately
npm run migrate          # Apply pending migrations
npm run seed:prod       # Run seeding script

# Option 3: Run with ts-node directly
npx ts-node prisma/seedProduction.ts

# Option 4: Compile to JavaScript first
npx tsc prisma/seedProduction.ts
node prisma/seedProduction.js
```

### Expected Output:

```
🌱 Starting production database seed...

📍 Creating parks...
  ✓ Created park: Central Dog Park (ID: 1)
  ✓ Created park: Riverside Dog Park (ID: 2)
  ✓ Created park: Forest Grove Dog Park (ID: 3)
  ✓ Created park: Sunset Park Dog Area (ID: 4)
  ✓ Created park: Meadow Dog Park (ID: 5)

👥 Creating users...
  ✓ Created ADMIN user: admin_user1 (ID: 1)
  ✓ Created ADMIN user: admin_user2 (ID: 2)
  ✓ Created DEVELOPER user: dev_user1 (ID: 3)
  ✓ Created DEVELOPER user: dev_user2 (ID: 4)
  ✓ Created DEVELOPER user: dev_user3 (ID: 5)

🐕 Creating dogs and assigning to users...
  ✓ Created dog: Max (ID: 1) - Owned by admin_user1
  ✓ Created dog: Luna (ID: 2) - Owned by admin_user2
  ✓ Created dog: Charlie (ID: 3) - Owned by dev_user1
  ✓ Created dog: Bella (ID: 4) - Owned by dev_user2
  ✓ Created dog: Cooper (ID: 5) - Owned by dev_user3

🏢 Creating organizations...
  ✓ Created organization: Friends of Central Dog Park (ID: 1) - Owned by admin_user1
  ✓ Created organization: City Dog Parks Alliance (ID: 2) - Owned by admin_user2

✅ Production seed completed successfully!

Summary:
  - Parks created: 5
  - Users created: 5
  - Dogs created: 5
  - Organizations created: 2
```

## Verification

### Option 1: Using Prisma Studio (Recommended)

```bash
npx prisma studio
```

This opens a visual GUI in your browser where you can:
- View all parks, users, and dogs
- Verify relationships (dog ownership)
- Edit data if needed
- Browse all tables

### Option 2: Manual Database Check

**For SQLite:**
```bash
# Install sqlite3 if needed
apt-get install sqlite3  # Linux
brew install sqlite3     # macOS

# Open database and query
sqlite3 prod.db
sqlite> SELECT * FROM User;
sqlite> SELECT * FROM Park;
sqlite> SELECT * FROM Dog;
sqlite> SELECT * FROM DogOwner;
```

**For PostgreSQL:**
```bash
psql -U user -d dogparkpals
\d  # List all tables
SELECT * FROM "User";
SELECT * FROM "Park";
SELECT * FROM "Dog";
SELECT * FROM "DogOwner";
```

## Pre-Production Checklist

Before running `npm run seed:prod` in production, verify all items:

### Security & Configuration

- [ ] **Password Hashes Generated**
  - [ ] Generated 5 bcrypt hashes (see Quick Start above)
  - [ ] All hashes are exactly 60 characters
  - [ ] All hashes start with `$2a$`, `$2b$`, `$2x$`, or `$2y$`
  - [ ] Replaced ALL placeholder hashes in `USERS` array

- [ ] **Database Configured**
  - [ ] `DATABASE_URL` is set in `.env` file
  - [ ] Database connection working: `npx prisma db execute --stdin < /dev/null`
  - [ ] Database is empty or you have a backup

- [ ] **Environment Correct**
  - [ ] Using correct database file/connection string
  - [ ] All other environment variables set

### Data Customization

- [ ] **Parks Updated** (`PARKS` array)
  - [ ] 5 parks with unique names
  - [ ] Correct latitude/longitude coordinates
  - [ ] Appropriate amenities for each park

- [ ] **Users Updated** (`USERS` array)
  - [ ] 5 unique email addresses
  - [ ] 5 unique usernames
  - [ ] All password hashes replaced with real bcrypt hashes
  - [ ] Correct roles (2 ADMIN, 3 DEVELOPER)

- [ ] **Dogs Updated** (`DOGS` array)
  - [ ] 5 dogs with unique names
  - [ ] Correct breeds (matching DogBreed enum)
  - [ ] DOGS.length === USERS.length (both 5)

- [ ] **Organizations Updated** (`ORGANIZATIONS` array)
  - [ ] Unique organization names
  - [ ] Valid ownerIndex values (0-4)

### Pre-Run Validation

- [ ] **Install Dependencies**
  ```bash
  npm install  # Includes devDependencies (tsx)
  ```

- [ ] **Apply Migrations**
  ```bash
  npm run migrate
  ```

### Running & Verification

- [ ] **Run Seeding Script**
  ```bash
  npm run seed:prod
  ```

- [ ] **Verify with Prisma Studio**
  ```bash
  npx prisma studio
  ```
  - [ ] 5 parks exist with correct data
  - [ ] 5 users exist with correct roles
  - [ ] 5 dogs exist with correct owners
  - [ ] 2 organizations exist
  - [ ] OrganizationMember records exist for org owners

- [ ] **Test User Authentication** (if possible)
  - [ ] Try logging in with generated users
  - [ ] Verify admins have correct permissions
  - [ ] Verify developers have correct permissions

- [ ] **Database Backup**
  - [ ] Create a backup of the database after successful seeding
  - [ ] Store backup securely

## Troubleshooting

### Error: "Database connection failed"
- Check `DATABASE_URL` in `.env` file
- Ensure database server is running (for PostgreSQL/MySQL)
- For SQLite, ensure the directory exists: `mkdir -p prisma/` then retry

### Error: "User email already exists"
- The script uses `upsert` which updates existing records
- To reset completely, delete the database file or run: `npx prisma migrate reset --force`
- **WARNING:** This deletes all data!

### Error: "Type 'unknown' is not assignable to type 'DogBreed'"
- Ensure dog breed matches exactly (case-sensitive)
- Check schema.prisma for valid DogBreed enum values

### Error: "ts-node command not found"
- Install TypeScript globally: `npm install -g ts-node typescript`
- Or use npx: `npx ts-node ...`

### Script runs but no data appears
- Check for errors in the console output
- Verify database connection with: `npx prisma db execute --stdin < query.sql`
- Check database permissions

## Resetting the Database

If you need to start over:

```bash
# WARNING: This deletes ALL data and resets migrations
npx prisma migrate reset --force

# Then run the seed script again
npx ts-node prisma/seedProduction.ts
```

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit plain text passwords** to version control
2. **Use environment variables** for sensitive data in production
3. **Rotate passwords regularly** after initial setup
4. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
5. **Restrict database access** to authorized users only
6. **Enable SSL/TLS** for remote database connections

## Running in Docker

If your database runs in Docker:

```bash
# Ensure database container is running
docker-compose up -d

# Wait for database to be ready
sleep 5

# Run the seed script
npx ts-node prisma/seedProduction.ts
```

## Need Help?

Check these resources:
- [Prisma Seeding Documentation](https://www.prisma.io/docs/guides/migrate/seed)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- Review the inline comments in [seedProduction.ts](seedProduction.ts)

## Deployment Flow

### Initial Production Setup

1. **Create and configure database**
   ```bash
   # Database must be created and accessible
   # Verify connection: npx prisma db execute --stdin < /dev/null
   ```

2. **Set environment variables**
   ```bash
   # In .env (never commit production secrets!)
   DATABASE_URL="postgresql://user:password@host:5432/dogparkpals"
   NODE_ENV="production"
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run migrations**
   ```bash
   npm run migrate
   ```

5. **Seed the database**
   ```bash
   npm run seed:prod
   ```

6. **Verify with Prisma Studio**
   ```bash
   npm run studio
   ```

### Subsequent Deployments

For future deployments **do NOT run seeding again** unless intentionally resetting:

```bash
# Typical deployment flow
npm run build           # Compile TypeScript
npm run migrate         # Apply any new migrations
npm start               # Start the server

# DO NOT run: npm run seed:prod (unless resetting)
```

### Important: Build ≠ Seed

The `npm run build` script:
- ✅ Compiles TypeScript to JavaScript
- ✅ Creates optimized output
- ❌ Does NOT seed the database (intentional)

This prevents accidental data loss during redeploys.

## Production Database Best Practices

### Security
- 🔐 Use strong, unique passwords (12+ characters, mixed case, numbers, symbols)
- 🔐 Never commit DATABASE_URL or passwords to git
- 🔐 Use environment variables for all secrets
- 🔐 Rotate admin passwords regularly
- 🔐 Enable SSL/TLS for database connections

### Backups
- 📦 Take database backup BEFORE seeding
- 📦 Set up automated daily backups
- 📦 Test restore procedures regularly
- 📦 Keep backups in secure, separate location

### Monitoring
- 📊 Monitor database connection health
- 📊 Set up alerts for failed migrations
- 📊 Track database size growth
- 📊 Monitor query performance

### Version Control
```bash
# .gitignore should include:
.env
.env.local
.env.*.local
dist/
node_modules/

# ⚠️ SQLite database files (NEVER commit live databases with user data!)
*.db
*.db-shm
*.db-wal
prisma/dev.db
prisma/prod.db
prisma/staging.db
```

**⚠️ CRITICAL SECURITY:** SQLite databases contain user credentials and password hashes. Accidentally committing a production database to version control can expose sensitive data. Always add `*.db` patterns to `.gitignore` to prevent this risk.

## Environment Configuration

### Example .env for Production (SQLite)

```env
# Database (using SQLite)
DATABASE_URL="file:./prod.db"

# Server
NODE_ENV=production
PORT=3000

# Other configs
JWT_SECRET=your-jwt-secret-here
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build
      - run: npm run migrate  # Apply migrations
      # DO NOT RUN SEED HERE - only on initial setup
      
      - name: Deploy to server
        run: |
          # Your deployment script here
```

### Initial Production Setup in CI/CD

For the **first deployment only**, create a separate workflow:

```yaml
name: Setup Production Database

on:
  workflow_dispatch:  # Manual trigger only

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run migrate
      - run: npm run seed:prod  # Only on initial setup!
```

## Troubleshooting Common Issues

### Issue: "Database connection refused"

```bash
# Check if database server is running
# For PostgreSQL:
psql -h host -U user -d dbname -c "SELECT 1"

# For SQLite:
ls -la prod.db

# Check DATABASE_URL in .env
echo $DATABASE_URL
```

### Issue: "Migration failed"

```bash
# Check migration status
npx prisma migrate status

# Resolve conflicts with:
npx prisma migrate resolve --rolled-back <migration_name>

# Or reset (PRODUCTION ONLY on first setup):
npx prisma migrate reset --force
```

### Issue: "Prisma Client not generated"

```bash
# Regenerate Prisma Client
npx prisma generate

# Then retry seeding
npm run seed:prod
```

### Issue: "Permission denied"

```bash
# For SQLite, check file permissions
chmod 644 prod.db
chmod 755 prisma/

# For PostgreSQL, check user permissions
```

## Rollback Procedure

If seeding fails and you need to rollback:

```bash
# For SQLite (delete and recreate)
rm prisma/prod.db
npm run migrate
# Before seeding again, check for errors

# For PostgreSQL (drop and recreate)
psql -U user -d postgres -c "DROP DATABASE dogparkpals_prod;"
psql -U user -d postgres -c "CREATE DATABASE dogparkpals_prod;"
npm run migrate
```

## Need Help?

Check these resources:
- [Prisma Seeding Documentation](https://www.prisma.io/docs/guides/migrate/seed)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- Review the inline comments in [seedProduction.ts](seedProduction.ts)
