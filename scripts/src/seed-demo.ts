import { db, usersTable, sosSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "mannmitra-secret-key";

function hashPassword(password: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(password).digest("hex");
}

async function seed() {
  console.log("Seeding demo user...");

  const email = "demo@mannmitra.com";
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (existing) {
    console.log("Demo user already exists, skipping.");
    process.exit(0);
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      email,
      passwordHash: hashPassword("Demo@123"),
      name: "Demo User",
      examType: "JEE",
    })
    .returning();

  console.log(`Created demo user: ${user.email} (id=${user.id})`);

  await db.insert(sosSettingsTable).values({
    userId: user.id,
    contactName: "Emergency Contact",
    contactPhone: "+91 98765 43210",
    isActive: true,
    message: "I need support right now. Please check in on me.",
  });

  console.log("Created default SOS settings for demo user.");
  console.log("Done!");
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
