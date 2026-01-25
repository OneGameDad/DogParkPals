import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const projectRoot = path.resolve(__dirname, "..", "..", "..");
const testDbPath = path.join(projectRoot, "prisma", "test.db");

// Ensure JWT secret is set for auth middleware/token creation during tests
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${testDbPath}`;
}

if (fs.existsSync(testDbPath)) {
  fs.rmSync(testDbPath);
}

execSync("npx prisma db push --skip-generate", {
  cwd: projectRoot,
  env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  stdio: "inherit",
});

// Import after DATABASE_URL is set
import { seedAll, resetData, closeDb } from "../fixtures/integrationFixtures";

beforeAll(async () => {
  await seedAll();
});

afterEach(async () => {
  await resetData();
  await seedAll();
});

afterAll(async () => {
  await resetData();
  await closeDb();
});
